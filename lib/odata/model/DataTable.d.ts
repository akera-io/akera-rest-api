export declare class DataTable {
    read(broker: any, query: any, cb: any): void;
    create(broker: any, table: any, data: any): void;
    update(broker: any, table: any, filter: any, data: any, cb: any): void;
    destroy(broker: any, table: any, filter: any, data: any, cb: any): void;
    save(broker: any, table: any, data: any, cb: any): void;
}
