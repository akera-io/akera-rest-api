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
exports.__esModule = true;
exports.AkeraApiServer = void 0;
var odata_v4_server_1 = require("odata-v4-server");
var express = require("express");
var decorators = require("../Utils/decorator");
var schema = require("./metadata.json");
var AkeraApiServer = /** @class */ (function (_super) {
    __extends(AkeraApiServer, _super);
    function AkeraApiServer() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AkeraApiServer = __decorate([
        odata_v4_server_1.odata.cors,
        odata_v4_server_1.odata.namespace("Akera")
    ], AkeraApiServer);
    return AkeraApiServer;
}(odata_v4_server_1.ODataServer));
exports.AkeraApiServer = AkeraApiServer;
var complexTypes = schema.dataServices.schema[0].complexType;
complexTypes.forEach(function (complexT) {
    var complexTDecorators = [];
    complexTDecorators.push(odata_v4_server_1.Edm.ComplexType);
    var properties = complexT.property;
    var propNames = [];
    properties.forEach(function (property, index) {
        propNames.push(property.name);
        complexTDecorators.push(decorators.decorateProperty(index, decorators.getType(property.type)));
    });
    AkeraApiServer.prototype[complexT.name] = new Function("return function(" + propNames.join(",") + "){\n        return " + propNames.join(",") + ";\n    }")();
    console.log("object(" + complexT.name + ") {\n        \n        propertiesName " + propNames.join(",") + ";\n      }");
    decorators.decorate(complexTDecorators, AkeraApiServer.prototype, complexT.name, null);
});
var functions = schema.dataServices.schema[0]["function"];
functions.forEach(function (func) {
    var funcDecorators = [];
    funcDecorators.push(odata_v4_server_1.Edm.FunctionImport, decorators.getType(func.returnType.type));
    var parameters = func.parameter;
    var paramNames = [];
    parameters.forEach(function (parameter, index) {
        paramNames.push(parameter.name);
        funcDecorators.push(decorators.decorateParameter(index, decorators.getType(parameter.type)));
    });
    AkeraApiServer.prototype[func.name] = new Function("return function(" + paramNames.join(", ") + ") { \n        console.log(\"" + func.name + "\", " + paramNames.join(",") + ");\n        return " + paramNames.join(",") + ";\n      }")();
    console.log("function(" + paramNames.join(", ") + ") {\n        \n        return " + paramNames.join(",") + "\n      }");
    decorators.decorate(funcDecorators, AkeraApiServer.prototype, func.name, null);
});
AkeraApiServer.$metadata(schema);
var app = express();
app.use("/odata", AkeraApiServer.create());
app.listen(2000, function () {
    console.log("Listening");
});
