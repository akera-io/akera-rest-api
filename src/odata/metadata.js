/*!
 * Copyright(c) 2016 Acorn IT
 *
 * OData model meta-data serialization (#metadata request)
 */

var builder = require('xmlbuilder');
var util = require('./util.js');

module.exports = function(model) {
  return buildMetadata(model);
};

function serializeProperty(name, property, entityNode) {
  if (property.navigation === true) {
    var navNode = entityNode.ele({
      'NavigationProperty' : {
        '@Name' : name,
        '@Type' : property.fk === true ? property.type : 'Collection('
            + property.type + ')',
        '@Nullable' : property.nullable === false ? false : true
      }
    });

    if (property.partner !== undefined)
      navNode.att('Partner', property.partner);

  } else {
    var propNode = entityNode.ele({
      'Property' : {
        '@Name' : name,
        '@Type' : property.type,
        '@Nullable' : property.nullable === false ? false : true,
      }
    });

    // optional property attributes
    if (property.maxLen !== undefined && !isNaN(property.maxLen + '.0')
        && property.maxLen > 0)
      propNode.att('MaxLength', property.maxLen);
    if (property.precision !== undefined && !isNaN(property.precision + '.0')
        && property.precision >= 0)
      propNode.att('Precision', property.precision);
    if (property.scale !== undefined && !isNaN(property.scale + '.0')
        && property.scale >= 0)
      propNode.att('Scale', property.scale);
    if (property.unicode === false)
      propNode.att('Unicode', false);
    if (property.initial !== undefined)
      propNode.att('DefaultValue', property.initial);

  }
};

function serializeEntityNavigations(model, entityType, setNode) {
  for ( var propKey in entityType.properties) {
    var property = entityType.properties[propKey];

    if (property.navigation === true) {
      setNode.ele({
        'NavigationPropertyBinding' : {
          '@Path' : propKey,
          '@Target' : model.getEntitySet(property.type)
        }
      });
    }
  }
}

function serializeMethod(method, entityType, entityNode, schemaNode) {
  var methodNode = method.definition.type === 'action' ? serializeActionNode(method, schemaNode) : serializeFunctionNode(method, entityNode, schemaNode);
  var params = util.getMethodParams(method.definition);
 
  if (methodNode)
    params.forEach(function(param) {
      if (param.definition.direction === 'in' || param.definition.direction === 'inout') {
        methodNode.ele({
          'Parameter' : {
            '@Name' : param.name,
            '@Type' : param.definition.type,
            '@Nullable' : param.definition.nullable || false
          }
        });
      }
    });
}

function serializeActionNode(method, schemaNode) {
  var actionNode = schemaNode.ele({
    'Action' : {
      '@Name': method.name,
      '@IsBound': method.definition.isBound || false
    }
  });
  return actionNode;
}

function serializeFunctionNode(method, entityNode, schemaNode) {
  var outParams = [];
  
  var params = util.getMethodParams(method.definition);
  params.forEach(function(param) {
    if (param.definition.direction === 'in' || param.definition.direction === 'inout')
      outParams.push(param);
  });
 
  if (outParams.length < 1)
    return null;
  
  var functionNode = entityNode.ele({
    'Function': {
      '@Name': method.name,
      '@IsBound': method.definition.isBound || false
    }
  });
 
  if (outParams.length === 1) {
    functionNode.ele({
      'ReturnType': {
        '@Name': outParams[0].name,
        '@Type': outParams[0].definition.type
      }
    });
  } else {
    var returnNode = schemaNode.ele({
      'ComplexType': {
        '@Name': method.name + '_return'
      }
    });
    
    outParams.forEach(function(param) {
      returnNode.ele({
        'Property': {
          '@Name': param.name,
          '@Type': param.definition.type
        }
      });
    });
  }
  
  return functionNode;
}

function serializeEntityContainerActions(entityTypes, containerNode, namespace) {
  Object.keys(entityTypes).forEach(function(type) {
    var actions = util.getMethods(entityTypes[type], 'action');
    actions.forEach(function(action) {
      containerNode.ele({
        'ActionImport' : {
          '@Name' : action.name,
          '@Action' : namespace + '.' + type + '.' + action.name 
        }
      });
    });
  });
}

function serializeEntityContainerFunctions(entityTypes, containerNode, namespace) {
  Object.keys(entityTypes).forEach(function(type) {
    var functions = util.getMethods(entityTypes[type], 'function');
    
    functions.forEach(function(func) {
      if (!func.definition.isBound)
      containerNode.ele({
        'FunctionImport': {
          '@Name': func.name,
          '@Function': namespace + '.' + type + '.' + func.name
        }
      });
    });
  });
}

function buildSchemaMetadata(schema, schemaNode, namespace) {
  for ( var typeKey in schema.entityTypes) {
    var entityNode = schemaNode.ele({
      'EntityType' : {
        '@Name' : typeKey
      }
    });

    if (schema.entityTypes[typeKey].key) {
      var keyNode = entityNode.ele('Key');

      schema.entityTypes[typeKey].key.forEach(function(pkKey) {
        keyNode.ele({
          PropertyRef : {
            '@Name' : pkKey
          }
        });
      });
    } else {
      entityNode.att('Abstract', true);
    }

    for ( var propKey in schema.entityTypes[typeKey].properties) {
      serializeProperty(propKey,
          schema.entityTypes[typeKey].properties[propKey], entityNode);
    }
    
    var methods = util.getMethods(schema.entityTypes[typeKey]);
    methods.forEach(function(method) {
        serializeMethod(method, schema.entityTypes[typeKey], entityNode, schemaNode);
    });
  }

  if (schema.complexTypes)
    for ( var typeKey in schema.complexTypes) {
      var complexNode = schemaNode.ele({
        'ComplexType' : {
          '@Name' : typeKey
        }
      });
  
      for ( var propKey in schema.complexTypes[typeKey]) {
        serializeProperty(propKey, schema.complexTypes[typeKey][propKey],
            complexNode);
      }
    }
  
  if (schema.entitySets) {
    var containerNode = schemaNode.ele({
      'EntityContainer' : {
        '@Name' : 'DefaultContainer'
      }
    });
    for ( var setKey in schema.entitySets) {
      var setNode = containerNode.ele({
        'EntitySet' : {
          '@EntityType' : schema.entitySets[setKey].entityType,
          '@Name' : setKey
        }
      });
      serializeEntityNavigations(schema.model, schema.model
          .getType(schema.entitySets[setKey].entityType), setNode);
    }
    serializeEntityContainerActions(schema.entityTypes, containerNode, namespace);
    serializeEntityContainerFunctions(schema.entityTypes, containerNode, namespace);
  }
};

function buildMetadata(model) {
  var namespaces = model.getNamespaces();
  
  var root = builder.create({
    'edmx:Edmx' : {
      '@xmlns:edmx' : 'http://docs.oasis-open.org/odata/ns/edmx',
      '@Version' : '4.0'
    }
  }, {
    version : '1.0',
    encoding : 'UTF-8',
    standalone : true
  });

  var service = root.ele('edmx:DataServices');

  namespaces.forEach(function(ns) {
    var schemaNode = service.ele({
      'Schema' : {
        '@xmlns' : 'http://docs.oasis-open.org/odata/ns/edm',
        '@Namespace' : ns
      }
    });

    buildSchemaMetadata(model.getNamespace(ns), schemaNode, ns);
  });
  
  return root.end({
    pretty : true
  });

}
