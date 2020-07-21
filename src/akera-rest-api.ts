import * as akeraApi from "@akeraio/api";
import { WebMiddleware } from "@akeraio/web-middleware";
import { ConnectionPool, ConnectionPoolOptions, LogLevel } from "@akeraio/api";
import { Router, Response, Request } from "express";

export interface parametersConfig {
  value: 12; // customer number
  type: "input-output" | "output" | string;
  dataType: "integer" | "longchar"; // start record
  json: true;
}
export interface brokersConfig {
  name: "demo";
  host: "localhost";
  port: 3737;
}

export class AkeraRestApi extends WebMiddleware {
  private _router: Router;
  p = akeraApi.Parameter;
  akeraApp = null;
  akeraWebApp: string;
  parameters: parametersConfig;
  public constructor() {
    super();
  }

  public mount(configPool: ConnectionPoolOptions | ConnectionPool): Router {
    if (this._router) {
      return this._router;
    }
    this._router = Router({
      mergeParams: true,
    });
  }

  public error(err: Error | string, res: Response): void {
    if (err) {
      if (err instanceof Error) {
        err = err.message;
      }

      res.status(500).send({
        message: err,
      });

      this.log(LogLevel.error, err);
    }
  }
  private log(level: LogLevel, msg: string, res?: Response) {
    if (akeraApi) {
      akeraApi.LogLevel;
    } else {
      console.log(level, msg, res);
    }
  }

  public getModelRoute(baseRoute, model): any {
    return baseRoute + "/" + model.name;
  }

  public handleRequest(req: Request, res: Response) {
    let broker: brokersConfig;
    let callProc = null;
    let callParams = null;
    let param: parametersConfig;
    if (req.method === "GET") {
      callProc = req.query.procedure;
      if (req.query.parameters && typeof req.query.parameters === "string") {
        try {
          callParams = JSON.parse(req.query.parameters);
        } catch (err) {
          return this.error(
            "Invalid procedure parameters format, must be a JSON array.",
            res
          );
        }
      }
    } else {
      const callProc =
        req.body.procedure || (req.body.call && req.body.call.procedure);
      const callParams =
        req.body.parameters || (req.body.call && req.body.call.parameters);
    }

    if (!callProc) {
      return this.error("Invalid or no procedure details specified.", res);
    }

    try {
      const p = akeraApi.Parameter;
      const q = akeraApi.DataType;
      akeraApi.connect(broker).then(
        function (conn) {
          try {
            var call = conn.call(callProc);

            if (callParams instanceof Array) {
              const parameters = [];

              callParams.forEach(function (param: parametersConfig) {
                var direction = param.type || "i";

                param.type =
                  typeof param.dataType === "string"
                    ? param.dataType.toLowerCase()
                    : q.CHARACTER;

                delete param.dataType;

                switch (direction) {
                  case "io":
                  case "inout":
                  case "input-output":
                    parameters.push(p.inout(param));
                    break;
                  case "o":
                  case "out":
                  case "output":
                    parameters.push(p.output(param));
                    break;
                  default:
                    parameters.push(p.input(param));
                }
              });

              this.parameters.apply(call, parameters);
            }

            call.then(
              function (response: any) {
                conn.disconnect();
                res.status(200).send(response);
              },
              function (err: Error) {
                conn.disconnect();
                this.error(err, res);
              }
            );
          } catch (err) {
            this.error(err, res);
          }
        },
        function (err: Error) {
          this.error(err, res);
        }
      );
    } catch (err) {
      this.error(err, res);
    }
  }

  public setupInterface(type: string, config: any, router: Router) {
    type = type || "rest";

    switch (
      type // TODO: support rest and jsdo interfaces
    ) {
      case "odata":
        var odataRouter = require("./odata/odata-router.js");
        odataRouter(config, router);
        break;
      case "rest":
        router.post(config.route, this.handleRequest);
        router.get(config.route, this.handleRequest);
        break;
      default:
        throw new Error("Invalid api interface specified");
    }
  }
}
