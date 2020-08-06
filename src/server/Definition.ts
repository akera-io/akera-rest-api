import {IABLNameCall, INameParameter} from "./Interfaces";
import {decorate, decorateParameter} from "../Utils/decorator";
import {Edm, odata} from "odata-v4-server";
import {DataType, Direction} from "@akeraio/api";

const mapping = {
  [DataType.CHARACTER]: Edm.String,
  [DataType.INTEGER]: Edm.Int32,
}

function addParamter(parameter: INameParameter, Request, Response) {
  if (parameter.direction === Direction.INPUT || parameter.direction === Direction.INOUT) {
    Object.defineProperty(Request.prototype, parameter.name, {
      configurable: true,
      writable: true
    });
    decorate([mapping[parameter.type]], Request.prototype, parameter.name, void 0);
  }

  if (parameter.direction === Direction.INPUT) {
    return;
  }

  Object.defineProperty(Response.prototype, parameter.name, {
    configurable: true,
    writable: true
  });
  decorate([mapping[parameter.type]], Response.prototype, parameter.name, void 0);
}

export default function getDefinition(oDataServer, definition: IABLNameCall) {
  const obj = Object.create(definition);

  const Response = function () {
  };
  const Request = function () {
  };

  (definition.parameters || []).forEach((parameter) => {
    if (parameter.type !== DataType.DATASET && parameter.type !== DataType.TABLE) {
      addParamter(parameter, Request, Response);
      return;
    }
  });

  decorate([Edm.ComplexType], Request);
  decorate([Edm.ComplexType], Response);

  oDataServer.prototype[obj.name] = function (req: Request) {
    return req;
  }

  decorate(
    [
      odata.POST,
      Edm.ActionImport,
      Edm.ComplexType(Response),
      decorateParameter(0, odata.body)
    ],
    oDataServer.prototype,
    obj.name
  );
}
