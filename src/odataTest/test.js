"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
exports.__esModule = true;
exports.AkeraApiServer = void 0;
var odata_v4_server_1 = require("odata-v4-server");
var express = require("express");
var schema = require("./metadata.json");
var findProduct_Product = /** @class */ (function () {
    function findProduct_Product() {
    }
    __decorate([
        odata_v4_server_1.Edm.String
    ], findProduct_Product.prototype, "Name");
    __decorate([
        odata_v4_server_1.Edm.Int32
    ], findProduct_Product.prototype, "Id");
    return findProduct_Product;
}());
// @odata.type(Product)
// class ProductCtrl extends ODataController {
// }
var AkeraApiServer = /** @class */ (function (_super) {
    __extends(AkeraApiServer, _super);
    //@odata.controller(ProductCtrl, true)
    function AkeraApiServer() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AkeraApiServer.prototype.findProduct = function (num) {
        return num;
    };
    __decorate([
        odata_v4_server_1.Edm.FunctionImport,
        odata_v4_server_1.Edm.Int64,
        __param(0, odata_v4_server_1.Edm.Int64)
    ], AkeraApiServer.prototype, "findProduct");
    AkeraApiServer = __decorate([
        odata_v4_server_1.odata.cors,
        odata_v4_server_1.odata.namespace("Akera")
        //@odata.controller(ProductCtrl, true)
    ], AkeraApiServer);
    return AkeraApiServer;
}(odata_v4_server_1.ODataServer));
exports.AkeraApiServer = AkeraApiServer;
//let servMetadata=ServiceMetadata.processEdmx(schema)
AkeraApiServer.$metadata(schema);
var app = express();
app.use("/odata", AkeraApiServer.create());
app.listen(3000);
