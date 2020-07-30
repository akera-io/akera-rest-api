import { Direction, DataType } from "@akeraio/api";

import { Edm } from "odata-v4-metadata";
import { Convert } from "odata-v4-server";

interface AkeraRestCatalog {
  namespace?: string;
  functions?: AkeraRestFunction[];
  actions?: AkeraRestAction[];
}

interface AkeraRestFunction extends AkeraRestAction {
  return: DataType | TempTable | DataSet;
}

interface AkeraRestAction {
  object: string;
  method?: string;
  parameters?: Parameter[];
}

interface Parameter {

  mode: Direction;
  dataType: DataType;
  dataStructure?: TempTable | DataSet;
}

interface TempTable {
  name: string;
  fields: Field[];
}

interface DataSet {
  name: string;
  tables: TempTable[];
}

interface Field {
  name: string;
  dataType: DataType;
}

Edm.Schema
