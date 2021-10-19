import { ODataServer, odata, Edm, ODataController } from "odata-v4-server";
import * as express from "express";
import { stringWriter } from "xmlbuilder";


let schema = require("./metadata.json");

class findProduct_Product {
  @Edm.String
  Name?: string;

  @Edm.Int32
  age?: number;
}

class getProduct_Product {
  @Edm.String
  Name?: string;

  @Edm.Collection(Edm.ComplexType(findProduct_Product))
  products?: findProduct_Product[];
}

// @odata.type(Product)
// class ProductCtrl extends ODataController {

// }

@odata.cors
@odata.namespace("Akera")
//@odata.controller(ProductCtrl, true)
export class AkeraApiServer extends ODataServer {

  @Edm.FunctionImport
  @Edm.ComplexType(findProduct_Product)
  findProduct(@Edm.Int64 num: number) {
    let ctype: findProduct_Product;
    ctype.Name = "Andrei";
    ctype.age = 23;
    return ctype

  }


  @Edm.FunctionImport
  @Edm.ComplexType(getProduct_Product)
  getProducts(@Edm.Int64 num: number) {
    let ctype: getProduct_Product = {Name: "Andrei"};

    ctype.products = [{ Name: "test", age: 23 },
    { Name: "test2", age: 123 }];
    return ctype

  }

  @Edm.ActionImport()
  @Edm.ComplexType(findProduct_Product)
  setProduct(
    @odata.body
    @Edm.ComplexType(findProduct_Product) prod: findProduct_Product) {
    prod.age = prod.age ? prod.age + 10 : 99;

    console.log(prod);
    return prod;

  }

  //static $metadata (): ServiceMetadata {
  // return ServiceMetadata.processMetadataJson(schema);
  //}
}

//let servMetadata=ServiceMetadata.processEdmx(schema)
// AkeraApiServer.$metadata(schema);

const app = express();
app.use("/odata", AkeraApiServer.create());

app.listen(3000);
