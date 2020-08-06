import {odata, ODataServer} from "odata-v4-server";
import * as express from "express";
import {IABLNameCall} from "./Interfaces";
import * as fs from "fs";
import * as path from "path";
import Definition from "./Definition";

@odata.cors
@odata.namespace("Akera")
export class AkeraApiServer extends ODataServer {
}

const fileContent = fs.readFileSync(path.join(__dirname, "./sample.json"), "utf-8");
const definition: IABLNameCall = JSON.parse(fileContent);
Definition(AkeraApiServer, definition);

const app = express();
app.use("/odata", AkeraApiServer.create());

app.listen(2000, () => {
  console.log("Listening");
});
