module.exports = ODataModel;
var path = require('path');

var oDataTypeMap = {
    character : 'Edm.String',
    integer : 'Edm.Int32',
    logical : 'Edm.Boolean',
    datetime : 'Edm.DateTime',
    datetimetz : 'Edm.DateTime',
    decimal : 'Edm.Decimal',
    blob : 'Edm.Binary',
    float : 'Edm.Float',
    timestamp : 'Edm.DateTime'
  };

function ODataModel(definition) {
  var self = this;
  var model = null;

  var checkLoaded = function(namespace) {
    if (!model) {
      throw new Error('Model not loaded.');
    }

    if (!model.schemas[namespace]) {
      throw new Error('Namespace not found in model definition.');
    }
  };

  var parseRelations = function() {
    if (model && model.entityRelations) {
      model.entityRelations.filter(function(rel) {
        return !rel.__processed;
      }).forEach(
          function(rel) {
            var parent = null;
            var child = null;

            try {
              parent = self.getType(rel.from);
              child = self.getType(rel.to);
            } catch (e) {
              // one of the relation's ends was not loaded yet
              return;
            }

            // first add navigation property in parent
            if (rel.name) {
              if (parent.properties[rel.name])
                throw new Error('Property already defined: ' + rel.name
                    + ' on ' + rel.from);

              parent.properties[rel.name] = {
                type : rel.to,
                partner : rel.partner,
                navigation : true,
                nullable : rel.nullable || false,
                onDelete : rel.onDelete || 'None'
              };

              if (rel.constraints)
                parent.properties[rel.name].constraints = rel.constraints;
            }

            // add navigation property in child
            if (rel.partner) {

              if (child.properties[rel.partner])
                throw new Error('Property already defined: ' + rel.partner
                    + ' on ' + rel.to);

              child.properties[rel.partner] = {
                type : rel.from,
                partner : rel.name,
                navigation : true,
                fk : true
              };

              if (rel.constraints)
                child.properties[rel.partner].constraints = rel.constraints;
            }

            rel.__processed = true;

          });
    }

  };

  this.getNamespaces = function() {
    return model ? Object.keys(model.schemas) : [];
  };

  this.getNamespace = function(namespace) {
    checkLoaded(namespace);

    return model.schemas[namespace];
  };

  this.hasNamespace = function(fullName) {
    return (fullName && fullName.indexOf('.') != -1);
  };

  this.getFullName = function(name, namespace) {
    return name && !this.hasNamespace(name) && namespace ? namespace + '.'
        + name : name;
  };

  this.getClassInfo = function(fullName, namespace) {
    if (this.hasNamespace(fullName)) {
      var idx = fullName.lastIndexOf('.');

      return {
        namespace : fullName.substring(0, idx),
        name : fullName.substr(idx + 1)
      };

    }

    return {
      name : fullName,
      namespace : namespace
    };
  };

  this.load = function(definition, broker) {
    var odataDef = {
        namespace: broker.name
    };
    
    odataDef.entityTypes = {
        
    };
    odataDef.entitySets = {
        
    };
    definition.forEach(function(mdl) {
      odataDef.entityTypes[mdl.name] = {
          properties: {}
      };
      
      //console.log('configuring %s', mdl.name);
      
      Object.keys(mdl.properties).forEach(function(prop) {
        if (mdl.properties[prop].type)
          mdl.properties[prop].type = oDataTypeMap[mdl.properties[prop].type.toLowerCase()] || mdl.properties[prop].type;
        odataDef.entityTypes[mdl.name].properties[prop] = mdl.properties[prop];
        
        if (mdl.properties[prop].key === true) {
           odataDef.entityTypes[mdl.name].key = odataDef.entityTypes[mdl.name].key || [];
           odataDef.entityTypes[mdl.name].key.push(prop);
        }
      });
      
      odataDef.entityTypes[mdl.name].actions = mdl.methods || [];
      odataDef.entityTypes[mdl.name].actions.forEach(function(action) {
        if (action.params) {
          action.params.forEach(function(param) {
            param.type = oDataTypeMap[param.type.toLowerCase()] || param.type;
          });
        }
      });
      
      odataDef.entitySets[mdl.name + 's'] = {
          entityType: broker.name + '.' + mdl.name
      };

    });
    definition = odataDef;
   // console.log(JSON.stringify(definition, null, '\t'));
    if (definition && definition.namespace) {
      if (!model)
        model = {
          schemas : {}
        };

      if (model.schemas[definition.namespace]) {
        throw new Error('Namespace already loaded.');
      }

      model.schemas[definition.namespace] = {
        model : this
      };

      var schema = model.schemas[definition.namespace];

      if (definition.entityTypes) {
        schema.entityTypes = {};

        Object.keys(definition.entityTypes).forEach(
            function(key) {
              // if not fully qualified type assume same namespace
              if (self.hasNamespace(key)) {
                throw new Error(
                    'Types can only be defined within the same namespace: '
                        + key);
              }

              schema.entityTypes[key] = definition.entityTypes[key];

            });
      }

      if (definition.entitySets) {
        schema.entitySets = {};

        Object.keys(definition.entitySets).forEach(
            function(key) {
              var entity = definition.entitySets[key];

              // if not fully qualified type assume same namespace
              entity.entityType = self.getFullName(entity.entityType,
                  definition.namespace);

              schema.entitySets[key] = entity;
            });
      }

      if (definition.entityRelations) {
        // relations can well be from different namespaces
        if (!model.entityRelations)
          model.entityRelations = [];

        definition.entityRelations
            .forEach(function(relation) {
              // if not fully qualified type assume same namespace
              relation.from = self.getFullName(relation.from,
                  definition.namespace);
              relation.to = self.getFullName(relation.to, definition.namespace);

              model.entityRelations.push(relation);
            });

        parseRelations();
      }
      this.modelDefinition = definition;
    } else {
      throw new Error('Invalid oData model definition.');
    }
  };

  this.getEntity = function(name, namespace) {
    var info = self.getClassInfo(name, namespace);

    checkLoaded(info.namespace);

    if (!model.schemas[info.namespace].entitySets
        || !model.schemas[info.namespace].entitySets[info.name]) {
      throw new Error('Entity not found in model definition: '
          + self.getFullName(info.name, info.namespace));
    }

    return model.schemas[info.namespace].entitySets[info.name];

  };

  this.getType = function(name, namespace) {

    var info = self.getClassInfo(name, namespace);

    checkLoaded(info.namespace);

    if (!model.schemas[info.namespace].entityTypes
        || !model.schemas[info.namespace].entityTypes[info.name]) {
      throw new Error('Type not found in model definition: '
          + self.getFullName(info.name, info.namespace));
    }

    return model.schemas[info.namespace].entityTypes[info.name];
  };

  this.getEntityType = function(name, namespace) {
    var info = self.getClassInfo(name, namespace);

    checkLoaded(info.namespace);

    var type = self
        .getClassInfo(this.getEntity(info.name, info.namespace).entityType);

    return this.getType(type.name, type.namespace);
  };

  this.getEntitySet = function(name, namespace) {

    var info = self.getClassInfo(name, namespace);

    checkLoaded(info.namespace);

    name = self.getFullName(info.name, info.namespace);

    if (model.schemas[info.namespace].entitySets) {
      for ( var eSet in model.schemas[info.namespace].entitySets) {
        if (model.schemas[info.namespace].entitySets[eSet].entityType === name)
          return eSet;
      }
    }

    throw new Error('No set defined for type in model definition: ' + name);
  };

  this.getPrimaryKey = function(name, namespace) {
    var keys = this.getEntityType(name, namespace).key;

    switch (keys.length) {
    case 0:
      return null
    case 1:
      return keys[0];
    default:
      return keys;
    }
  };

  // load the model definition if passed on constructor
  if (definition)
    this.load(definition);
}