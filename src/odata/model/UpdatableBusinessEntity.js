var utils = require('util');
var BusinessEntity = require('./BusinessEntity.js');

function UpdatableBusinessEntity() {
  BusinessEntity.call(this);
}

utils.inherits(UpdatableBusinessEntity, BusinessEntity);

UpdatableBusinessEntity.prototype.create = function(collection, data, broker) {};
UpdatableBusinessEntity.prototype.update = function(collection, filter, data, broker) {};
UpdatableBusinessEntity.prototype.destroy = function(collection, filter, data, broker) {};

module.exports = UpdatableBusinessEntity;