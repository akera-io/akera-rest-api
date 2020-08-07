import {
  ODataServer,
  odata,
  Edm,
  ODataController,
  ODataBase,
} from "odata-v4-server";
import * as express from "express";
import { stringWriter } from "xmlbuilder";

const schema = require("./metadata.json");

class XY {
  @Edm.String
  public a: string;
  @Edm.Int64
  public b: number;
}

class findProduct_Product {
  @Edm.String
  public name: string;

  @Edm.Int32
  public age: number;

  @Edm.Collection(Edm.ComplexType(XY))
  public text: XY[];

  constructor(name: string, age: number, text: XY[]) {
    this.name = name;
    this.age = age;
    this.text = text;
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
    const num = x.name;
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
