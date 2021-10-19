import {IABLCall, IParameter} from "@akeraio/api";
import {Edm} from "odata-v4-server";

export interface IABLNameCall extends IABLCall {
  name: string;
  parameters?: INameParameter[]
}

export interface INameParameter extends IParameter {
  name: string
}

export enum ABL2ODataMapping {
  CHARACTER = Edm.String,
  INTEGER = Edm.Int32,
  DECIMAL = Edm.Decimal,
  INT64 = Edm.Int64,
  DATE = Edm.Date,
  DATETIME = Edm.DateTimeOffset,
  DATETIMETZ = Edm.DateTimeOffset,
  LOGICAL = Edm.Boolean,
  LONGCHAR = Edm.String,
  MEMPTR = Edm.Binary,
}