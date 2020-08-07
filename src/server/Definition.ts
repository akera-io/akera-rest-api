import {IABLNameCall, INameParameter} from "./Interfaces";
import {decorate, decorateParameter} from "../Utils/decorator";
import {Edm, odata} from "odata-v4-server";
import {DataType, Direction, IDatasetSchema, ITableSchema} from "@akeraio/api";

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

function addParameter(parameter: INameParameter, Request, Response) {
  if (parameter.direction === Direction.INPUT || parameter.direction === Direction.INOUT) {
    Object.defineProperty(Request.prototype, parameter.name, {
      configurable: true,
      writable: true
    });
    decorate([ABL2ODataMapping[parameter.type.toUpperCase()]], Request.prototype, parameter.name, void 0);
  }

  if (parameter.direction === Direction.INPUT) {
    return;
  }

  Object.defineProperty(Response.prototype, parameter.name, {
    configurable: true,
    writable: true
  });
  decorate([ABL2ODataMapping[parameter.type.toUpperCase()]], Response.prototype, parameter.name, void 0);
}

function defineTable(parameterSchema: ITableSchema) {
  const row = new Function(`return function ${parameterSchema.name}() {}`)();

  parameterSchema.fields.forEach((field) => {
    Object.defineProperty(row.prototype, field.name, {
      configurable: true,
      writable: true
    });
    decorate([ABL2ODataMapping[field.type.toUpperCase()]], row.prototype, field.name, void 0);
  });

  return row;
}

function addTableParameter(parameter: INameParameter, Request, Response, ComplexObjects = {}) {
  ComplexObjects[parameter.name] = defineTable(<ITableSchema>parameter.schema);

  if (parameter.direction === Direction.INPUT || parameter.direction === Direction.INOUT) {
    Object.defineProperty(Request.prototype, parameter.name, {
      configurable: true,
      writable: true
    });
    decorate(
      [Edm.Collection(Edm.ComplexType(ComplexObjects[parameter.name]))],
      Request.prototype,
      parameter.name,
      void 0);
  }

  if (parameter.direction === Direction.INPUT) {
    return;
  }

  Object.defineProperty(Response.prototype, parameter.name, {
    configurable: true,
    writable: true
  });
  decorate(
    [Edm.Collection(Edm.ComplexType(ComplexObjects[parameter.name]))],
    Response.prototype,
    parameter.name,
    void 0);
}

function addDatasetParameter(parameter: INameParameter, Request, Response, ComplexObjects = {}) {
  const dsSchema: IDatasetSchema = <IDatasetSchema>parameter.schema;
  ComplexObjects[parameter.name] = new Function(`return function ${parameter.name}() {}`)();

  dsSchema.tables.forEach((table) => {
    const tableDefinition = defineTable(table)
    Object.defineProperty(ComplexObjects[parameter.name].prototype, table.name, {
      configurable: true,
      writable: true
    });
    decorate(
      [Edm.Collection(Edm.ComplexType(tableDefinition))],
      ComplexObjects[parameter.name].prototype,
      table.name,
      void 0);
  });

  if (parameter.direction === Direction.INPUT || parameter.direction === Direction.INOUT) {
    Object.defineProperty(Request.prototype, parameter.name, {
      configurable: true,
      writable: true
    });
    decorate(
      [Edm.ComplexType(ComplexObjects[parameter.name])],
      Request.prototype,
      parameter.name,
      void 0);
  }

  if (parameter.direction === Direction.INPUT) {
    return;
  }

  Object.defineProperty(Response.prototype, parameter.name, {
    configurable: true,
    writable: true
  });
  decorate(
    [Edm.ComplexType(ComplexObjects[parameter.name])],
    Response.prototype,
    parameter.name,
    void 0);
}

export default function getDefinition(oDataServer, definition: IABLNameCall) {
  const obj = Object.create(definition);

  const Response = function () {
  };
  const Request = function () {
  };

  const ComplexObjects = {};

  (definition.parameters || []).forEach((parameter) => {
    if (parameter.type !== DataType.DATASET && parameter.type !== DataType.TABLE) {
      addParameter(parameter, Request, Response);
    }
    if (parameter.type === DataType.TABLE) {
      addTableParameter(parameter, Request, Response, ComplexObjects);
    }
    if (parameter.type === DataType.DATASET) {
      addDatasetParameter(parameter, Request, Response, ComplexObjects);
    }
  });

  oDataServer.prototype[obj.name] = function (req) {
    return {
      ...req,
      ds1: {
        leTT2: [...req.tt1],
        leTT3: [...req.tt1],
      }
    };
  }

  decorate(
    [
      odata.POST,
      Edm.ActionImport,
      Edm.ComplexType(Response),
      decorateParameter(0, odata.body),
      decorateParameter(0, Edm.ComplexType(Request))
    ],
    oDataServer.prototype,
    obj.name
  );
}
