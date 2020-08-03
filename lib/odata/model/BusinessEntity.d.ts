import { Util } from "../util";
export declare class BusinessEntity {
    util: Util;
    read(query?: any, broker?: any, cb?: any): any;
    prune(doc: any, model: any, type: any): void;
}
