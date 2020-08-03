"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils = require("util");
const BusinessEntity_1 = require("./BusinessEntity");
class UpdatableBusinessEntity {
    constructor() {
        this.b = this.businessEntity.read(this);
    }
    ;
}
exports.UpdatableBusinessEntity = UpdatableBusinessEntity;
utils.inherits(UpdatableBusinessEntity, BusinessEntity_1.BusinessEntity);
UpdatableBusinessEntity.prototype.create = function (collection, data, broker) { };
UpdatableBusinessEntity.prototype.update = function (collection, filter, data, broker) { };
UpdatableBusinessEntity.prototype.destroy = function (collection, filter, data, broker) { };
//# sourceMappingURL=UpdatableBusinessEntity.js.map