import {DataType, Direction, IDatasetSchema, ITableSchema} from "@akeraio/api";
import {Edm, odata} from "odata-v4-server";

import {ABL2ODataMapping, IABLNameCall, INameParameter} from "./Interfaces";

/**
 * An Akera OData Catalog definition parser.
 */
export class Catalog {
  /**
   * The object sent by the user to the application.
   */
  private requestObject = function Request() {
  };

  /**
   * The object sent by the application to the user.
   */
  private responseObject = function Response() {
  };

  /**
   * A list with defined ComplexType objects.
   */
  private complexObjects = {};

  /**
   * The catalog definition.
   */
  private definition: IABLNameCall;

  /**
   * Constructor of the catalog.
   *
   * @param catalogDefinition The catalog definition.
   */
  protected constructor(catalogDefinition: IABLNameCall) {
    this.definition = catalogDefinition;
  }

  /**
   * Parses the given catalog definition and attaches the metadata to the
   * given ODataServer class.
   *
   * @param oDataServer The class used to serve OData requests.
   * @param catalogDefinition The catalog definition.
   */
  public static parse(oDataServer, catalogDefinition: IABLNameCall): Catalog {
    const instance = new Catalog(catalogDefinition);
    return instance.init(oDataServer);
  }

  /**
   * Initializes the catalog and attaches the method defined by the
   * catalog to the ODataServer class.
   */
  private init(oDataServer) {
    if (this.definition.parameters) {
      this.parseParameters();
    }

    oDataServer.prototype[this.definition.name] = this.execute;

    this.decorate(
      [
        odata.POST,
        Edm.ActionImport,
        Edm.ComplexType(this.responseObject),
        this.decorateParameter(0, odata.body),
        this.decorateParameter(0, Edm.ComplexType(this.requestObject))
      ],
      oDataServer.prototype,
      this.definition.name
    );

    return this;
  }

  /**
   * Executes the actual requests and send back the response.
   *
   * @param req The request object.
   */
  public execute(req) {
    return {
      ...req,
      ds1: {
        leTT2: [...req.tt1],
        leTT3: [...req.tt1],
      }
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
  protected decorate(decorators: any[], target: any, key?: any, descriptor?: any) {
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
   * Decorate the parameters of a function.
   *
   * @param parameterIndex The index of the parameter (zero based).
   * @param decorator The decorator function.
   */
  protected decorateParameter(parameterIndex: number, decorator: Function) {
    return function (target, key) {
      decorator(target, key, parameterIndex);
    };
  }

  /**
   * Parses the parameters defined in the catalog.
   */
  protected parseParameters() {
    this.definition.parameters.forEach((parameter) => {
      switch (parameter.type) {
        case DataType.TABLE:
          this.defineTable(parameter);
          break;
        case DataType.DATASET:
          this.defineDataset(parameter);
          break;
        default:
          this.addParameter(parameter.name, parameter.direction, [ABL2ODataMapping[parameter.type.toUpperCase()]]);
      }
    });
  }

  /**
   * Adds a parameter to the request and/or response object. Decorates the parameter
   * with the right OData type.
   *
   * @param name The name of the parameter.
   * @param type The type of the parameter: INPUT, INOUT, OUTPUT.
   * @param decorators A list with decorators that will be applied to the parameter.
   */
  protected addParameter(name: string, type: Direction, decorators: Function[]) {
    if (type !== Direction.OUTPUT) {
      this.addInputParameter(name, decorators);
    }
    if (type !== Direction.INPUT) {
      this.addOutputParameter(name, decorators);
    }
  }

  /**
   * Adds an input/input-output parameter to the request object. Decorates the parameter
   * with the right OData type.
   *
   * @param name The name of the parameter.
   * @param decorators A list with decorators that will be applied to the parameter.
   */
  protected addInputParameter(name: string, decorators: Function[]) {
    Object.defineProperty(this.requestObject.prototype, name, {
      configurable: true,
      writable: true
    });

    this.decorate(decorators, this.requestObject.prototype, name, void 0);
  }

  /**
   * Adds an output/input-output parameter to the response object. Decorates the parameter
   * with the right OData type.
   *
   * @param name The name of the parameter.
   * @param decorators A list with decorators that will be applied to the parameter.
   */
  protected addOutputParameter(name: string, decorators: Function[]) {
    Object.defineProperty(this.responseObject.prototype, name, {
      configurable: true,
      writable: true
    });

    this.decorate(decorators, this.responseObject.prototype, name, void 0);
  }

  /**
   * Defines a Table ComplexType that will be used in the request/response object.
   *
   * @param parameter The parameter that will be added.
   */
  protected defineTable(parameter: INameParameter) {
    if (!this.complexObjects[parameter.name]) {
      this.complexObjects[parameter.name] = this.defineTableRow(<ITableSchema>parameter.schema);
    }

    this.addParameter(
      parameter.name,
      parameter.direction,
      [Edm.Collection(Edm.ComplexType(this.complexObjects[parameter.name]))]
    )
  }

  /**
   * Defines the row of a Table ComplexType.
   *
   * @param tableSchema The table row schema.
   */
  protected defineTableRow(tableSchema: ITableSchema): Function {
    /**
     * In order to have the Correct Complex Type name defined in metadata we need to define
     * the function like this.
     *
     * You can test to see what happens by swapping the comments for the next 2 lines.
     */
    const row = new Function(`return function ${tableSchema.name}() {}`)();
    // const row = function() {};

    tableSchema.fields.forEach((field) => {
      Object.defineProperty(row.prototype, field.name, {
        configurable: true,
        writable: true
      });
      this.decorate([ABL2ODataMapping[field.type.toUpperCase()]], row.prototype, field.name, void 0);
    });

    return row;
  }

  /**
   * Defines a Dataset ComplexType that will be used in the request/response object.
   *
   * @param parameter The parameter that will be added.
   */
  protected defineDataset(parameter: INameParameter) {
    const dsSchema: IDatasetSchema = <IDatasetSchema>parameter.schema;

    let dataset = this.complexObjects[parameter.name];
    if (!dataset) {
      /**
       * In order to have the Correct Complex Type name defined in metadata we need to define
       * the function like this.
       *
       * You can test to see what happens by swapping the comments for the next 2 lines.
       */
      dataset = new Function(`return function ${parameter.name}() {}`)();
      // dataset = function () {};

      this.complexObjects[parameter.name] = dataset;

      dsSchema.tables.forEach((table) => {
        const tableDefinition = this.complexObjects[table.name] || this.defineTableRow(table);

        Object.defineProperty(dataset.prototype, table.name, {
          configurable: true,
          writable: true
        });
        this.decorate(
          [Edm.Collection(Edm.ComplexType(tableDefinition))],
          dataset.prototype,
          table.name,
          void 0);
      });
    }

    this.addParameter(
      parameter.name,
      parameter.direction,
      [Edm.ComplexType(this.complexObjects[parameter.name])]
    )
  }
}