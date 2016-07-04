var akeraApi = require('akera-api');
var util = require('../util.js');

function BusinessEntity() {
}

BusinessEntity.prototype.read = function(query, broker, cb) {
  var mdlInfo = util.getEntityNameFromRoot(query.collection, query.model);

  if (!mdlInfo)
    return cb(new Error('Collection "' + query.collection + '" was not found.'));

  var table = mdlInfo.name;
  var namespace = mdlInfo.namespace;

  akeraApi.connect(broker).then(
      function(conn) {
        var q = util.transformAkeraQuery(akeraApi.query.select(table), query,
            query.collection, query.model);
        q.build();
        q.all().then(
            function(result) {
              var entityType;
              try {
                entityType = query.model.getEntityType(query.collection,
                    namespace);
              } catch (e) {
                return cb(e);
              }
              result.forEach(function(r) {
                prune(r, query.model.getNamespace(mdlInfo.namespace),
                    entityType);
              });
              conn.disconnect();
              cb(null, result);
            }, function(err) {
              conn.disconnect();
              cb(err);
            });
      }, cb);
};

function prune(doc, model, type) {

  if (doc instanceof Array) {
    for ( var i in doc) {
      prune(doc[i], model, type);
    }
    return;
  }

  for ( var prop in doc) {
    if (!prop || doc[prop] === undefined)
      continue;

    var propDef = type.properties && type.properties[prop] || type[prop];
    if (!propDef) {
      delete doc[prop];
      continue;
    }

    if (propDef.type.indexOf("Collection") === 0) {
      if (propDef.type.indexOf("Collection(Edm") === 0) {
        continue;
      }
      var complexTypeName = propDef.type.replace("Collection("
          + model.namespace + ".", "");
      complexTypeName = complexTypeName
          .substring(0, complexTypeName.length - 1);
      var complexType = model.complexTypes[complexTypeName];
      if (!complexType)
        throw new Error("Complex type " + complexTypeName + " was not found.");

      for ( var i in doc[prop]) {
        prune(doc[prop][i], model, complexType);
      }
      continue;
    }

    if (propDef.type.indexOf("Edm") !== 0) {
      var complexTypeName = propDef.type.replace(model.namespace + ".", "");
      var complexType = model.complexTypes
          && model.complexTypes[complexTypeName];
      // if (!complexType)
      // throw new Error("Complex type " + complexTypeName + " was not found.");
      if (complexType)
        prune(doc[prop], model, complexType);
    }
  }
}

module.exports = BusinessEntity;