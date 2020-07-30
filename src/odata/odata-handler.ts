import { UpdatableBusinessEntity } from "./model/UpdatableBusinessEntity";
import * as readHelper from "./crud/read";
import { Request, Response } from "express";
import {ODataQuery,odata} from "odata-v4-server"
import{ODataModel} from './model'



export class doRead {
  req: Request;
  res: Response;
  Req: globalThis.Request;

  bs: UpdatableBusinessEntity;
  odataQuery: ODataQuery; //{ model?: any; $inlinecount?: any; };

  Querydata() {
    this.odataQuery = readHelper.getQuery(this.Req);
    this.odataQuery.model = this.req.ODataModel;
  }

  read(err: Error, result: string) {
    this.bs.b(this.odataQuery, this.req.host);

    if (err) {
      this.res.odataError(err, 404);
    } else {
      this.res.writeHead(200, {
        "Content-Type": "application/json",
        "OData-Version": "4.0",
      });

      let out = {
        "@odata.context":
          this.req.url + "$metadata#" + this.req.params.collection,
        value: result,
      };

      if (this.odataQuery.$inlinecount) {
        out["@odata.count"] = result.length;
        out.value = result;
      }

      this.res.end(JSON.stringify(out));
    }
  }
}
export let doCreate = function (req: Request, res: Response) {};
export let doDelete = function (req: Request, res: Response) {};
export let doUpdate = function (req: Request, res: Response) {};
