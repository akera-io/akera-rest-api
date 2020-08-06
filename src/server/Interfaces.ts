import {IABLCall, IParameter} from "@akeraio/api";

export interface IABLNameCall extends IABLCall {
  name: string;
  parameters?: INameParameter[]
}

export interface INameParameter extends IParameter {
  name: string
}