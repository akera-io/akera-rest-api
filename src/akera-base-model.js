var akera = require('akera-api');

function AkeraBaseModel(broker, definition) {
  this.broker = broker;
  this.definition = definition;
}

AkeraBaseModel.metadata = function metadata() {
  return this.definition;
};

AkeraBaseModel.prototype.find = function find(filter, cb) {
  if (typeof (filter) === 'function' && !cb) {
    cb = filter;
    filter = null;
  }
  cb = cb || noOp;

  var self = this;
  akera.connect(this.broker).then(
      function(connection) {
        var query = connection.query.select(self.definition.name);
        if (filter && typeof (filter) === 'object') {
          query.fields(filter.fields);

          if (filter.where && typeof (filter.where) === 'object'
              && Object.keys(filter.where) > 0) {
            query.where(filter.where);
          }

          Object.keys(filter).forEach(function(filterKey) {
            try {
              utils.model.filter(filterKey, filter);
            } catch (e) {
            }
          });
        }

        query.all().then(function(rows) {
          if (Array.isArray(rows)) {
            rows.forEach(function(row) {
              utils.model.rowToModel(row, self.definition, false);
            });
          }
          connection.disconnect().then(function() {
            cb(null, rows);
          }, function(err) {
            cb(err, rows);
          });
        }, function(err) {
          connection.disconnect();
          cb(err);
        });
      }, cb);
};

AkeraBaseModel.prototype.create = function create(data, cb) {
  if (typeof (data) === 'function' && !cb) {
    cb = data;
    data = null;
  }
  cb = cb || noOp;

  var self = this;

  if (Array.isArray(data)) {
    return async.map(data, function(record, mcb) {
      self.create(record, mcb);
    }, cb);
  }

  akera.connect(this.broker).then(
      function(connection) {
        var query = connection.query.insert(self.definition.akera
            && self.definition.akera.table || self.definition.name);

        query.set(utils.model.modelToRow(data, self.definition));

        query.fetch().then(function(row) {
          connection.disconnect().then(function() {
            cb(null, row);
          }, function(err) {
            cb(err, row);
          });
        }, function(err) {
          connection.disconnect();
          cb(err);
        });
      }, cb);
};

AkeraBaseModel.prototype.destroy = function destroy(filter, cb) {
  if (typeof (filter) === 'function' && !cb) {
    cb = filter;
    filter = null;
  }
  cb = cb || noOp;

  var self = this;

  akera.connect(this.broker).then(
      function(connection) {
        var query = connection.query.destroy(self.definition.akera
            && self.definition.table || self.definition.name);

        if (filter && typeof (filter) === 'object'
            && Object.keys(filter).length > 0) {
          query.where(filter);
        }

        query.go().then(function(affectedRows) {
          connection.disconnect().then(function() {
            cb(null, {
              count : affectedRows
            });
          }, function(err) {
            cb(err, affectedRows);
          });
        }, function(err) {
          connection.disconnect();
          cb(err);
        });
      }, cb);
};

AkeraBaseModel.prototype.update = function update(filter, data, cb) {
  if (!data || typeof(data) !== 'object' || Object.keys(data) < 1)
    return cb(new Error('No update data provided'));

  cb = cb || noOp;

  var self = this;
  
  akera.connect(this.broker).then(function(connection) {
    var query = connection.query.update(self.definition.akera && self.definition.akera.table || self.definition.name);
    if (filter && typeof(filter) === 'object' && Object.keys(filter) > 0) {
     query.where(filter);
     try {
       query.set(utils.model.modelToRow(data, self.definition));
     } catch(e) {
       return cb(e);
     }
     
     query.fetch().then(function(rows) {
       if (Array.isArray(rows)) {
         rows.forEach(function(row) {
           utils.model.rowToModel(row, self.definition, true);
         });
       }
       connection.disconnect().then(function() {
         cb(null, rows);
       }, function(err) {
         cb(err, rows);
       });
     }, cb);
    }
  }, cb);
};

function noOp() {
}

module.exports = AkeraBaseModel;