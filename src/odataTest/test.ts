import {
  ODataServer,
  odata,
  Edm,
  ODataController,
  ODataBase,
} from "odata-v4-server";
import * as express from "express";
import { stringWriter } from "xmlbuilder";

let schema = require("./metadata.json");

class findProduct_Product {
  @Edm.String
  public name: string;

  @Edm.Int32
  public age: number;

  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }
}

// @odata.type(Product)
// class ProductCtrl extends ODataController {

// }

@odata.cors
@odata.namespace("Akera")
//@odata.controller(ProductCtrl, true)
export class AkeraApiServer extends ODataServer {
  @odata.POST
  @Edm.Action
  @Edm.ComplexType(findProduct_Product)
  findProduct(
    @odata.body x:findProduct_Product
  ) {
    let num = x.name;
    console.log(num, x.age);
    return x;
  }

  //static $metadata (): ServiceMetadata {
  // return ServiceMetadata.processMetadataJson(schema);
  //}
}
//let servMetadata=ServiceMetadata.processEdmx(schema)
//AkeraApiServer.$metadata(schema);

const app = express();
app.use("/odata", AkeraApiServer.create());

app.listen(3000);
