var akera = require('akera-api');
var f = akera.query.filter;

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
      console.log(k);
      if (entity[k].key == true) {
        console.log('found key', k);
        return k;
      }
    }
    return null;
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