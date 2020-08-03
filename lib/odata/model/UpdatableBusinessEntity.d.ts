import { BusinessEntity } from './BusinessEntity';
export declare class UpdatableBusinessEntity {
    businessEntity: BusinessEntity;
    b: any;
    constructor();
    create: (collection: any, data: any, broker: any) => void;
    update: (collection: any, filter: any, data: any, broker: any) => void;
    destroy: (collection: any, filter: any, data: any, broker: any) => void;
}
