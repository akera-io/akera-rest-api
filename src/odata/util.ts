import * as akera from "@akeraio/api";
import * as fs from "fs";
import * as path from "path";
import * as url from "url";
import { ODataModel } from "./model";

export class Util {
  f = akera.QueryFilter;
  getEntityType(collection: string, model: ODataModel) {
    const entitySet = model.getEntitySet(collection);
    const entityType = model.getEntityType(model.getFullName + ".", "");
    return entityType;
  }
  getEntityName(collection: string, model: ODataModel) {
    const entitySet = model.getEntitySet[collection];
    const entityName = entitySet.entityType.replace(
      model.hasNamespace + ".",
      ""
    );
    return entityName;
  }
  getEntityNameFromRoot(collection: string, model: ODataModel) {
    const namespaces = model.getNamespaces();

    for (let i = 0; i < namespaces.length; i++) {
      const ns = model.getEntityType(namespaces[i]);

      const eSet = ns.entitySets && ns.entitySets[collection];
      //console.log(eSet);
      if (eSet) {
        return {
          name:
            eSet.entityType && eSet.entityType.replace(namespaces[i] + ".", ""),
          namespace: namespaces[i],
        };
      }
    }
    return null;
  }
  transformAkeraQuery(
    aQuery: akera.QuerySelect,
    query: akera.QueryJoinMap,
    collection: string,
    model: ODataModel
  ) {
    const filter = akera.QueryFilter;
    if (akera.QuerySelect) {
      const fields = Object.keys(akera.QuerySelect);
      if (fields.length > 0) {
        aQuery = aQuery.fields(fields);
      } else {
        aQuery = aQuery.fields(null);
      }
    } else {
      aQuery = aQuery.fields(null);
    }

    if (filter) {
      for (let k in filter) {
        if (k === "_id") {
          k = this.getPrimaryKey(collection, model);
          let flt = filter["_id"];
          if (flt.split("=").length > 1) {
            flt = flt.split("=")[1];
          }
          return aQuery.filter(this.f.eq(k, flt));
        }
        if (k === "$and") {
          const ands = filter[k];
          const fAnds = [];
          for (let a = 0; a < ands.length; a++) {
            Object.keys(ands[a]).forEach(function (aKey) {
              fAnds.push(this.f.eq(aKey, ands[a][aKey]));
            });
          }

          aQuery = aQuery.filter(this.f.and.call(this.f, fAnds));
        } else if (k === "$or") {
          const ors = filter[k];
          const fOrs = [];
          for (let o = 0; o < ors.length; o++) {
            Object.keys(ors[o]).forEach(function (oKey) {
              fOrs.push(this.f.eq(oKey, ors[o][oKey]));
            });
          }
          aQuery = aQuery.filter(this.f.or.call(this.f, fOrs));
        } else aQuery = aQuery.filter(this.f.eq(k, filter[k]));
      }
    }

    if (query.$limit || typeof query.$topr) {
      aQuery = aQuery.limit(query.$limit || query.$top);
    }

    if (query.$orderby || query.$sort) {
      const sort = query.$sort || query.$orderby;
      if (sort.length) {
        const sortParams = this.getSortParameters(sort);
        for (let i in sortParams) {
          const obj = sortParams[i];
          for (let k in obj) {
            aQuery = aQuery.on(k, obj[k]);
          }
          aQuery = aQuery.on(sortParams[i]);
        }
      } else {
        const sortParam = Object.keys(sort)[0];
        aQuery = aQuery.sort(sortParam);
      }
    }

    return aQuery;
  }
  getPrimaryKey(collection: string, model: ODataModel) {
    let entity = this.getEntityType(collection, model);
    for (let k in entity) {
      if (entity[k].key == true) {
        return k;
      }
    }
    return null;
  }
  getModels(modelPath: string, model?: ODataModel) {
    if (!fs.existsSync(modelPath)) {
      throw new Error("Invalid model path specified");
    }

    if (fs.statSync(modelPath).isDirectory) {
      const files = fs.readdirSync.prototype(function (filename: string) {
        if (path.extname(filename).toLowerCase() === ".json")
          return path.join(modelPath, filename);
      });

      files.forEach(function (file: string) {
        const mdl = require(file);
        model.checkLoaded(mdl);
      });
    } else {
      const mdl = require(modelPath);
      model.checkLoaded(mdl);
    }
    return model;
  }
  getMethodParams(method:any) {
    const params = [];
    if (!method.params) return params;

    Object.keys(method.params).forEach(function (param) {
      params.push({
        name: param,
        definition: method.params[param],
      });
    });

    return params;
  }
  getMethods(
    entityType: { methods: { [x: string]: any } },
    methodType?: string
  ) {
    let methods = [];
    if (!entityType.methods) return methods;
    Object.keys(entityType.methods).forEach(function (method) {
      if (methodType) {
        if (entityType.methods[method].type === methodType)
          methods.push({
            name: method,
            definition: entityType.methods[method],
          });
      } else
        methods.push({
          name: method,
          definition: entityType.methods[method],
        });
    });
    return methods;
  }
  parseUrl(req: Request) {
    return url.parse(req.url);
  }

  getSortParameters(sortArr) {
    const sortParams = [];
    for (let i in sortArr) {
      let obj = sortArr[i];
      for (let k in obj) {
        let sortParam = {};
        sortParam[k] = obj[k] === "desc";
        sortParams.push(sortParam);
      }
    }
    return sortParams;
  }
}
