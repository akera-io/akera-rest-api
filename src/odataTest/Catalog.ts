import {
  IABLCall,
  IDatasetSchema,
  ITableSchema,
  IParameter,
  Direction,
  DataType
} from "@akeraio/api";
import { Edm } from "odata-v4-metadata";


// let catalog:AkeraRestCatalog[];
// let schema:Edm.Schema;
interface AkeraRestCatalog {
  namespace?: string;
  functions?: Array<IAPI>;
}

interface IAPIParameter extends IParameter {
  name: string;
  complexType?: Object;
}

interface IAPI extends IABLCall {
  name: string;
  schema?: [ITableSchema | IDatasetSchema];
  parameters?: IAPIParameter[];
}

class APIParameter implements IAPIParameter {
  direction: Direction;
  type?: DataType;
  schema?: ITableSchema | IDatasetSchema;
  name: string;

}

let convert = function (catalog: AkeraRestCatalog) {
  let schema: Edm.Schema;
  let funcSchema: Edm.Function;
  schema.namespace = catalog.namespace;
  function function1() {

  }

}


