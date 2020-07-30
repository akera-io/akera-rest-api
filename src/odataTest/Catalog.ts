import { Direction, DataType, IABLCall , IDatasetSchema, ITableSchema} from "@akeraio/api";

import { Edm } from "odata-v4-metadata";


interface AkeraRestCatalog {
  namespace?: string;
  functions?: API[];
 
}

interface API extends IABLCall {
  schema:ITableSchema| IDatasetSchema;
}


