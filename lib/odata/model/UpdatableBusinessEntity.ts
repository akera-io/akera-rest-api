import * as utils from'util';
import{BusinessEntity}from './BusinessEntity';

export class UpdatableBusinessEntity {
  businessEntity:BusinessEntity;
   b=this.businessEntity.read(this);
 
 constructor(){};
 create: (collection: any, data: any, broker: any) => void;
 update: (collection: any, filter: any, data: any, broker: any) => void;
 destroy: (collection: any, filter: any, data: any, broker: any) => void

}

utils.inherits(UpdatableBusinessEntity, BusinessEntity);

UpdatableBusinessEntity.prototype.create = function(collection, data, broker) {};
UpdatableBusinessEntity.prototype.update = function(collection, filter, data, broker) {};
UpdatableBusinessEntity.prototype.destroy = function(collection, filter, data, broker) {};

