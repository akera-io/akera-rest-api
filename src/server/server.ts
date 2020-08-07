import {odata, ODataServer} from "odata-v4-server";
import * as express from "express";
import * as fs from "fs";
import * as path from "path";

import {IABLNameCall} from "./Interfaces";
import {Catalog} from "./Catalog";

@odata.cors
@odata.namespace("Akera")
export class AkeraApiServer extends ODataServer {
}

const fileContent = fs.readFileSync(path.join(__dirname, "./sample_akeraCall.json"), "utf-8");
// const fileContent = fs.readFileSync(path.join(__dirname, "./sample3.json"), "utf-8");
// const definition: IABLNameCall = JSON.parse(fileContent);
const definitions: IABLNameCall[] = JSON.parse(fileContent);
// Catalog.parse(AkeraApiServer, definition);
Catalog.parseArray(AkeraApiServer, definitions);

const app = express();
app.use("/odata", AkeraApiServer.create());
// TODO: Disable stacktrace process.env.ODATA_V4_DISABLE_STACKTRACE
app.listen(2000, () => {
  console.log("Listening");
});
