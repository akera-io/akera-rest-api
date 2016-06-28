/*!
 * Copyright(c) 2016 Acorn IT
 *
 * OData model meta-data serialization (#metadata request)
 */

var builder = require('xmlbuilder');

module.exports = function(model) {
  return buildMetadata(model);
}

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

function serializeAction(method, entityType, schemaNode) {
  var actionNode = schemaNode.ele({
    'Action' : {
      '@Name': method.name,
      '@IsBound': true
    }
  });
  
  method.params.forEach(function(param) {
    if (param.direction === 'in' || param.direction === 'inout') {
      actionNode.ele({
        'Parameter' : {
          '@Name' : param.name,
          '@Type' : param.type,
          '@Nullable' : param.required || false
        }
      });
    }
  });
}

function serializeEntityContainerActions(entityTypes, containerNode, namespace) {
  Object.keys(entityTypes).forEach(function(type) {
    //console.log(entityTypes[type]);
    var actions = entityTypes[type].actions;
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

function buildSchemaMetadata(schema, schemaNode, namespace) {
  //console.log(schema.model.getNamespaces());
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
    
    schema.entityTypes[typeKey].actions.forEach(function(method) {
        serializeAction(method, schema.entityTypes[typeKey], schemaNode);
    });
  }

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

  namespaces.forEach(function(namespace) {
    var schemaNode = service.ele({
      'Schema' : {
        '@xmlns' : 'http://docs.oasis-open.org/odata/ns/edm',
        '@Namespace' : namespace
      }
    });

    buildSchemaMetadata(model.getNamespace(namespace), schemaNode, namespace);
  });

  return root.end({
    pretty : true
  });

}
