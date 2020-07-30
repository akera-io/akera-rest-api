import * as odataServer from "odata-v4-server";

export function decorateMetadata(key, value) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(key, value);
}

export function decorateParameter(parameterIndex, decorator) {
  return function (target, key) {
    decorator(target, key, parameterIndex);
  }
}

export function decorate(decorators, target, key, desc) {
  const c = arguments.length;
  let r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") {
    r = Reflect.decorate(decorators, target, key, desc);
  } else {
    for (let i = decorators.length - 1; i >= 0; i--) {
      const d = decorators[i];
      if (d) {
        r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      }
    }
  }
  return c > 3 && r && Object.defineProperty(target, key, r), r;
}

export function getType(typeName) {
  const typeSplit = typeName.split(".");

  let type = odataServer;
  for (const typeName of typeSplit) {
    type = type[typeName];
  }

  return type;
}