"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AkeraApiServer = void 0;
const odata_v4_server_1 = require("odata-v4-server");
const express = require("express");
let schema = require("./metadata.json");
let AkeraApiServer = class AkeraApiServer extends odata_v4_server_1.ODataServer {
    akeraCall(...args) {
        console.log(args);
    }
};
__decorate([
    odata_v4_server_1.Edm.FunctionImport,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AkeraApiServer.prototype, "akeraCall", null);
AkeraApiServer = __decorate([
    odata_v4_server_1.odata.cors,
    odata_v4_server_1.odata.namespace("Akera")
], AkeraApiServer);
exports.AkeraApiServer = AkeraApiServer;
AkeraApiServer.$metadata(schema);
const app = express();
app.use("/odata", AkeraApiServer.create());
app.listen(3000, () => {
    console.log("Listening");
});
//# sourceMappingURL=testNonExistent.js.map