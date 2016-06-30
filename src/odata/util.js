var akera = require('akera-api');
var f = akera.query.filter;
var fs = require('fs');
var path = require('path');

module.exports = {
  getEntityType : function(collection, model) {
    var entitySet = model.entitySets[collection];
    var entityType = model.entityTypes[entitySet.entityType.replace(
        model.namespace + ".", "")];
    return entityType;
  },
  getEntityName : function(collection, model) {
    var entitySet = model.entitySets[collection];
    var entityName = entitySet.entityType.replace(model.namespace + ".", "");
    return entityName;
  },
  transformAkeraQuery : function(aQuery, query, collection, model) {
    var filter = query.$filter;
    if (query.$select) {
      var fields = Object.keys(query.$select);
      if (fields.length > 0) {
        aQuery = aQuery.fields(fields);
      } else {
        aQuery = aQuery.fields();
      }
    } else {
      aQuery = aQuery.fields();
    }

    if (filter) {
      for ( var k in filter) {
        if (k === '_id') {
          k = this.getPrimaryKey(collection, model);
          var flt = filter['_id'];
          if (flt.split('=').length > 1) {
            flt = flt.split('=')[1];
          }
          return aQuery.where(f.eq(k, flt));

        }
        if (k === '$and') {
          var ands = filter[k];
          var fAnds = [];
          for (var a=0; a<ands.length; a++) {
             Object.keys(ands[a]).forEach(function(aKey) {
               fAnds.push(f.eq(aKey, ands[a][aKey]));
             });
          }
          
          aQuery = aQuery.where(f.and.call(f, fAnds));
        } else if (k === '$or') {
          var ors = filter[k];
          var fOrs = [];
          for (var o=0; o<ors.length; o++) {
            Object.keys(ors[o]).forEach(function(oKey) {
              fOrs.push(f.eq(oKey, ors[o][oKey]));
            });
          }
          aQuery = aQuery.where(f.or.call(f, fOrs));
        }
        
        else
        aQuery = aQuery.where(f.eq(k, filter[k]));
      }
    }

    
    if (query.$limit || query.$top) {
      aQuery = aQuery.limit(query.$limit || query.$top);
    }

    if (query.$orderby || query.$sort) {
      var sort = query.$sort || query.$orderby;
      if (sort.length) {
        var sortParams = getSortParameters(sortArr);
        for ( var i in sortParams) {
          var obj = sortParams[i];
          for ( var k in obj) {
            aQuery = aQuery.by(k, obj[k]);
          }
          aQuery = aQuery.by(sortParams[i]);
        }
      } else {
        var sortParam = Object.keys(sort)[0];
        var desc = sort[sortParam] === -1;
        aQuery = aQuery.by(sortParam, desc);
      }
    }
   
    return aQuery;
  },
  getPrimaryKey : function(collection, model) {
    var entity = this.getEntityType(collection, model);
    for ( var k in entity) {
      if (entity[k].key == true) {
        return k;
      }
    }
    return null;
  },
  getModels : function(modelPath) {
    if (!fs.existsSync(modelPath)) {
      throw new Error('Invalid model path specified');
    }
    
    var model = require('./model.js');
    model = new model();
    
    
    if (fs.statSync(modelPath).isDirecotry) {  
      var files = fs.readdirSync().map(function(filename) {
        if (path.extname(filename).toLowerCase() === '.json')
          return path.join(modelPath, filename);
      });

      files.forEach(function(file) {
          var mdl = require(file);
          model.load(mdl);
      });     
    } else {
      var mdl = require(modelPath);
      model.load(mdl);
    }  
    return model;  
  },
  getMethodParams: function(method) {
    var params = [];
    if (!method.params)
      return params;
    
    Object.keys(method.params).forEach(function(param) {
      params.push({
        name: param,
        definition: method.params[param]
      });
    });
    
    return params;
  },
  getMethods: function(entityType, methodType) {
    var methods = [];
    if (!entityType.methods)
      return methods;
    Object.keys(entityType.methods).forEach(function(method) {
      if (methodType) {
        if (entityType.methods[method].type === methodType)
          methods.push({
            name: method,
            definition: entityType.methods[method]
          });
      }
        else methods.push({
          name: method,
          definition: entityType.methods[method]
        });
    });
    return methods;
  }
};

function getSortParameters(sortArr) {
  var sortParams = [];
  for ( var i in sortArr) {
    var obj = sortArr[i];
    for ( var k in obj) {
      var sortParam = {};
      sortParam[k] = obj[k] === 'desc';
      sortParams.push(sortparam);
    }
  }
  return sortParams;
}