import * as odataServer from "odata-v4-server";
import {Edm, odata} from "odata-v4-server";

/**
 * Decorate a functions metadata info with some values.
 *
 * @param key The key to be decorated.
 * @param value The value of the decoration.
 */
export function decorateMetadata(key, value) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
    return Reflect.metadata(key, value);
}

/**
 * Decorate the parameters of a function.
 *
 * @param parameterIndex The index of the parameter (zero based).
 * @param decorator The decorator function.
 */
export function decorateParameter(parameterIndex, decorator) {
  return function (target, key) {
    decorator(target, key, parameterIndex);
  };
}

/**
 * Decorate the properties of a class.
 *
 * @param propertyIndex The index of the property (zero based).
 * @param decorator The decorator function.
 */
export function decorateProperty(propertyIndex, decorator) {
  return function (target, key) {
    decorator(target, key, propertyIndex);
  };
}

/**
 * Decorate a function.
 *
 * @param decorators An array with decorator functions
 * @param target The target class that will be decorated.
 * @param key The element that will be decorated.
 * @param descriptor The property descriptor of the specified object.
 */
export function decorate(decorators: any[], target: any, key?: any, descriptor?: any) {
  const count = arguments.length;
  let result = target;

  if (count >= 3) {
    descriptor === null
      ? (descriptor = Object.getOwnPropertyDescriptor(target, key))
      : descriptor;
  }

  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") {
    result = Reflect.decorate(decorators, target, key, descriptor);
  } else {
    for (let i = decorators.length - 1; i >= 0; i--) {
      const d = decorators[i];
      if (d) {
        result = (count < 3 ? d(result) : count > 3 ? d(target, key, result) : d(target, key)) || result;
      }
    }
  }
  return count > 3 && result && Object.defineProperty(target, key, result), result;
}

/**
 * Returns the right EDM type.
 *
 * @param typeName The name of the type.
 * @param ComplexObjects A list with ComplexType objects.
 */
export function getType(typeName, ComplexObjects = {}) {
  const typeSplit = typeName.split(".");

  let type = odataServer;
  for (let typeName of typeSplit) {
    let parameters = [];
    if (typeName.indexOf("(") >= 0) {
      const splitName = typeName.split("(");
      typeName = splitName[0];
      parameters = splitName[1].substring(0, splitName[1].length - 1)
        .split(",")
        .map((element) => ComplexObjects[element.trim()])
    }
    type = parameters.length > 0 ? type[typeName](...parameters) : type[typeName];
  }

  return type;
}


/**
 * Defines a custom ComplexType object.
 *
 * @param complexType The type definition.
 */
export function defineComplexType(complexType) {
  const paramNames = [];
  (complexType.property || []).forEach((property) => {
    paramNames.push(property.name);
  });

  const complexObject = new Function(`return function ${complexType.name}(${paramNames.join(", ")}) {
        ${paramNames.map((paramName) => `this.${paramName} = ${paramName};`).join("\n")}
  
        console.log("${complexType.name}", ${paramNames.length ? paramNames.join(",") : "''"});
      }`)();

  decorate([Edm.ComplexType], complexObject);

  (complexType.property || []).forEach((property) => {
    decorate([
        getType(property.type)
      ],
      complexObject.prototype,
      property.name,
      void 0
    );
  });

  return complexObject;
}

/**
 * Creates all the custom defined ComplexTypes.
 *
 * @param definition The list with definition schemes.
 */
export function defineComplexTypes(definition) {
  const ComplexObjects = {};
  (definition || []).forEach((complexType) => {
    ComplexObjects[complexType.name] = defineComplexType(complexType);
  });

  return ComplexObjects;
}

/**
 * Dynamically defines all the OData Function methods on the class definition.
 *
 * @param classDefinition The class on which we will define the methods.
 * @param ComplexObjects The list with ComplexType objects.
 * @param functionDefintion The list with function that will be defined.
 */
export function decorateClassFunctions(classDefinition, ComplexObjects, functionDefintion) {
  functionDefintion.forEach((func) => {
    const funcDecorators = [];
    funcDecorators.push(Edm.FunctionImport, getType(func.returnType.type, ComplexObjects));
    const parameters = func.parameter || [];
    const paramNames = [];
    parameters.forEach((parameter, index) => {
      paramNames.push(parameter.name);
      funcDecorators.push(decorateParameter(index, getType(parameter.type, ComplexObjects)));
    });
    classDefinition.prototype[func.name] = new Function(`return function(${paramNames.join(", ")}) {
        console.log("${func.name}", ${paramNames.length ? paramNames.join(",") : "''"});
        return ${paramNames.length ? paramNames.join(",") : "''"};
      }`)();
    decorate(funcDecorators, classDefinition.prototype, func.name, null);
  });
}

/**
 * Dynamically defines all the OData Action methods on the class definitions.
 *
 * @param classDefinition The class on which we will define the method.
 * @param ComplexObjects The list with ComplexType objects.
 * @param actionDefinition The list with decoration definitions for the method.
 */
export function decorateClassActions(classDefinition, ComplexObjects, actionDefinition) {
  actionDefinition.forEach((func) => {
    const funcDecorators = [];
    funcDecorators.push(odata.POST, Edm.ActionImport, getType(func.returnType.type, ComplexObjects));
    const parameters = func.parameter || [];
    const paramNames = [];
    parameters.forEach((parameter, index) => {
      paramNames.push(parameter.name);
      funcDecorators.push(decorateParameter(index, odata.body));
    });
    classDefinition.prototype[func.name] = new Function(`return function(${paramNames.join(", ")}) {
        console.log("${func.name}", ${paramNames.length ? paramNames.join(",") : "''"});
        return ${paramNames.length ? paramNames.join(",") : "''"};
      }`)();

    decorate(funcDecorators, classDefinition.prototype, func.name, null);
  });
}


