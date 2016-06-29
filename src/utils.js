var fs = require('fs');
var path = require('path');
var util = require('util');
var AkeraBaseModel = require('./akera-base-model.js');
var Model = require('./model.js');
var oDataModel = require('./odata/model.js');
var oDataMeta = require('./odata/metadata.js');
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

module.exports = {
  model : {
    filter : {
      fields : function(q, filter) {
        if (filter.fields) {
          var modelFields = q.model && q.model.fields;

          if (modelFields) {
            var fields = filter.fields.forEach(function(field) {
              return modelFields[field] || field;
            });

            q.fields(fields);

          } else {
            q.fields(filter.fields);
          }
        }
      },
      limit : function(q, filter) {
        if (filter.limit) {
          q.limit(filter.limit);
        }
      },
      offset : function(q, filter) {
        var offset = 0;

        if (typeof filter.offset === 'number')
          offset = filter.offset;
        else if (typeof filter.skip === 'number')
          offset = filter.skip;

        q.offset(offset);
      },
      order : function(q, filter) {
        if (filter.order) {
          if (filter.order instanceof Array) {
            for ( var i in filter.order) {
              setSorting(q, filter.order[i]);
            }
          } else if (typeof filter.order === 'string') {
            setSorting(q, filter.order);
          }
        }
      }
    },
    rowToModel : function(row, model, mapFields) {

      if (mapFields === true)
        row = renameProperties(row, switchKeyValues(model.fieldMap));

      for ( var key in model.fields) {
        if (row[key]) {
          switch (model.fields[key].type) {
          case 'Buffer':
            row[key] = new Buffer(row[key], 'base64');
            break;
          default:
            break;
          }
        }
      }

      return row;
    },
    modelToRow : function(data, model) {

      renameProperties(data, model.fieldMap);

      for ( var key in data) {
        if (Buffer.isBuffer(data[key])) {
          data[key] = data[key].toString('base64');
        }
      }

      return data;
    }
  },
  getModels : function(path) {
    if (!fs.existsSync(path)) {
      return [];
    }
    try {
      return require(path);
    } catch (e) {
    }

    if (fs.statSync(path).isDirecotry()) {
      var files = fs.readdirSync().map(function(filename) {
        if (path.extname(filename).toLowerCase() === '.json')
          return path.join(path, filename);
      });

      var models = [];

      files.forEach(function(file) {
        models.push(require(file));
      });

      return models;
    }
  },
  getModelClass : function(modelPath, model, broker) {
    try {
      var baseCls = model.inheritBase ? AkeraBaseModel : Model;

      var instance = new baseCls(broker, model);

      var jsPath = path.join(path.dirname(modelPath), model.name + '.js');
      require(jsPath)(instance);
      return instance;
    } catch (e) {
      return null;
    }
  },
  getOdataModel : function(model, broker) {
    try {
      var mdl = new oDataModel();
      mdl.load(model, broker);
      return mdl;
    } catch (e) {
      console.log(e);
      return null;
    }
  },
  getOdataMeta : function(oDataModel) {
    try {
      return oDataMeta(oDataModel);
    } catch (e) {
      console.log(e);
      return null;
    }
  },
  escapeRegExp : function(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  },
  edmType : function(type) {
    return oDataTypeMap(type.toLowerCase()) || type;
  },
  getOdataCtxUrl: function(req, collection) {
    var url = req.protocol + '://' + req.get('host') + req.originalUrl;
    url = url.split(collection)[0] + '$metadata#' + collection;
    return url;
  }
};

function switchKeyValues(obj) {
  if (obj && typeof obj === 'object') {
    var flip = {};
    for ( var key in obj) {
      flip[obj[key]] = key;
    }

    return flip;
  }
  return obj;
}

function renameProperty(obj, name, alias) {
  if (obj[name] !== undefined) {
    obj[alias] = obj[name];
    delete obj[name];
  }
}

function renameProperties(obj, fieldMap) {
  if (fieldMap && typeof fieldMap === 'object') {
    for ( var key in fieldMap) {
      renameProperty(obj, key, fieldMap[key]);
    }
  }
}