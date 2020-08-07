import {Edm, odata, ODataServer, ComplexType} from "odata-v4-server";
import * as express from "express";

import * as decorators from "../Utils/decorator";

const schema = require("./metadata.json");

@odata.cors
@odata.namespace("Akera")
export class AkeraApiServer extends ODataServer {
}

const ComplexObjects = decorators.defineComplexTypes(schema.dataServices.schema[0].complexType);
// decorators.decorateClassFunctions(AkeraApiServer, ComplexObjects, schema.dataServices.schema[0].function);
decorators.decorateClassActions(AkeraApiServer, ComplexObjects, schema.dataServices.schema[0].action);

// AkeraApiServer.$metadata(schema);

const app = express();
app.use("/odata", AkeraApiServer.create());

app.listen(2000, () => {
  console.log("Listening");
});
