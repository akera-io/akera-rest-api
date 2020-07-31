"use strict";
exports.__esModule = true;
exports.getType = exports.decorate = exports.decorateProperty = exports.decorateParameter = exports.decorateMetadata = void 0;
var odataServer = require("odata-v4-server");
function decorateMetadata(key, value) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
        return Reflect.metadata(key, value);
}
exports.decorateMetadata = decorateMetadata;
function decorateParameter(parameterIndex, decorator) {
    return function (target, key) {
        decorator(target, key, parameterIndex);
    };
}
exports.decorateParameter = decorateParameter;
function decorateProperty(propertyIndex, decorator) {
    return function (target, key) {
        decorator(target, key, propertyIndex);
    };
}
exports.decorateProperty = decorateProperty;
function decorate(decorators, target, key, desc) {
    var c = arguments.length;
    var r = c < 3
        ? target
        : desc === null
            ? (desc = Object.getOwnPropertyDescriptor(target, key))
            : desc;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") {
        r = Reflect.decorate(decorators, target, key, desc);
    }
    else {
        for (var i = decorators.length - 1; i >= 0; i--) {
            var d = decorators[i];
            if (d) {
                r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
            }
        }
    }
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
exports.decorate = decorate;
function getType(typeName) {
    var typeSplit = typeName.split(".");
    var type = odataServer;
    for (var _i = 0, typeSplit_1 = typeSplit; _i < typeSplit_1.length; _i++) {
        var typeName_1 = typeSplit_1[_i];
        type = type[typeName_1];
    }
    return type;
}
exports.getType = getType;
