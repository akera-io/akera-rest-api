import {Edm, odata, ODataServer} from "odata-v4-server";
import * as express from "express";

import * as decorators from "../Utils/decorator";

const schema = require("./metadata.json");

@odata.cors
@odata.namespace("Akera")
export class AkeraApiServer extends ODataServer {
}

const functions = schema.dataServices.schema[0].function;

functions.forEach((func) => {
  const funcDecorators = [];
  funcDecorators.push(Edm.FunctionImport, decorators.getType(func.returnType.type));
  const paramNames = [];
  func.parameter.forEach((parameter, index) => {
    paramNames.push(parameter.name);
    funcDecorators.push(decorators.decorateParameter(index, decorators.getType(parameter.type)));
  });

  AkeraApiServer.prototype[func.name] = new Function(`return function(${paramNames.join(", ")}) { 
    console.log("${func.name}", ${paramNames.join(",")});
    return ${paramNames.join(",")};
  }`)();

  console.log(`function(${paramNames.join(", ")}) {
    console.log("${func.name}", ${paramNames.join(",")});
    return ${paramNames.join(",")};
  }`);
  decorators.decorate(funcDecorators, AkeraApiServer.prototype, func.name, null);
});

AkeraApiServer.$metadata(schema);

const app = express();
app.use("/odata", AkeraApiServer.create());

app.listen(3000, () => {
  console.log("Listening");
});

