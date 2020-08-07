import {
  IABLCall,
  IDatasetSchema,
  ITableSchema,
} from "@akeraio/api";
import {Edm} from "odata-v4-metadata";


// let server:AkeraRestCatalog[];
// let schema:Edm.Schema;
interface AkeraRestCatalog {
  namespace?: string;
  functions?: Array<API>;
}

interface API extends IABLCall {

  schema: [ITableSchema | IDatasetSchema];
}

const convert = function (catalog: AkeraRestCatalog) {
  let schema: Edm.Schema;
  let funcSchema: Edm.Function;
  schema.namespace = catalog.namespace;

  function function1() {

  }

}


