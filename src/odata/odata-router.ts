import { MetadataBuilder } from "./metadata.js";
import { Util } from "./util.js";
import * as odataHandler from "./odata-handler.js";
import * as xmlbuilder from "xmlbuilder";
import { Response, Request } from "express";
import { config } from "process";
import { Url } from "url";
import { request } from "http";
export interface Config {
  route: "/rest-api/";
  modelPath: "WEBPATH";
}
export interface router {
  __broker: {
    name: "demo";
  };
}

export class ODataRouter {
  config: Config;
  util: Util;
  model = this.util.getModels(this.config.modelPath);
  router: router;
  httpPrefix = `${this.config.route} odata/`;
  broker = this.router.__broker;
  metadataBuilder: MetadataBuilder;
  serviceUrl: Url;

  checkMetadataBuilder(req: Request) {
    if (!this.metadataBuilder) {
      this.serviceUrl.port = req.protocol;
      this.serviceUrl.host = req.get("host");
      this.serviceUrl.hostname = this.broker.name;
      this.serviceUrl.search = this.httpPrefix;
      this.metadataBuilder = new MetadataBuilder(this.serviceUrl);
    }
  }

  use(req: Request, res: Response, next) {
    this.checkMetadataBuilder(req);
    req.OdataModel = this.model;
    req.url = this.serviceUrl.search;
    this.broker = router.__broker;
    res.odataError = _odataErr;
    next();

  }

  getResult( res: Response) {
    const result = this.metadataBuilder.buildCollections(this.model);
    res.writeHead(200, {
      "Content-Type": "application/xml",
      DataServiceVersion: "4.0",
      "OData-Version": "4.0",
    });
    return res.end(result);
  }

  getMeta( res: Response) {
    const meta = this.metadataBuilder.buildMetadata(this.model);
    res.writeHead(200, {
      "Content-Type": "application/xml",
      DataServiceVersion: "4.0",
      "OData-Version": "4.0",
    });
    res.end(meta);
  }

  _odataErr(err: Error, statusCode: number, res: Response) {
    const rootNode = xmlbuilder.create({
      "m:error": {
        "@xmlns:m": "http://docs.oasis-open.org/odata/ns/metadata",
      },
    });

    rootNode.ele("m:code", {}, statusCode || "500");
    rootNode.ele("m:message", {}, err.message);
    rootNode.ele("stack", {}, err.stack);

    rootNode.end();
    res.writeHead(statusCode || 500, {
      "Content-Type": "application/xml",
      DataServiceVersion: "4.0",
      "OData-Version": "4.0",
    });
    res.end(rootNode.toString());
  }
}
