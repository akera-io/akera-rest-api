import { Util } from "../util";
import * as akeraApi from "@akeraio/api";

export class BusinessEntity {
  util: Util;

  read(query?, broker?, cb?) {
    const mdlInfo = this.util.getEntityNameFromRoot(
      query.collection,
      query.model
    );

    if (!mdlInfo)
      return cb(
        new Error('Collection "' + query.collection + '" was not found.')
      );

    const table = mdlInfo.name;
    const namespace = mdlInfo.namespace;

    akeraApi.connect(broker).then(function (conn) {
      const q = this.util.transformAkeraQuery(
        new akeraApi.QuerySelect(table, namespace),
        akeraApi.Query,
        akeraApi.Query.arguments,
        akeraApi.Query.name
      );
      q.build();
      q.all().then(
        function (result) {
          let entityType;
          try {
            entityType = query.model.getEntityType(query.collection, namespace);
          } catch (e) {
            return cb(e);
          }
          result.forEach(function (r: any) {
            this.prune(
              r,
              query.model.getNamespace(mdlInfo.namespace),
              entityType
            );
          });
          conn.disconnect();
          cb(null, result);
        },
        function (err) {
          conn.disconnect();
          cb(err);
        }
      );
    }, cb);
  }

  public prune(doc, model, type) {
    if (doc instanceof Array) {
      for (let i in doc) {
        this.prune(doc[i], model, type);
      }
      return;
    }

    for (let prop in doc) {
      if (!prop || doc[prop] === undefined) continue;

      const propDef = (type.properties && type.properties[prop]) || type[prop];
      if (!propDef) {
        delete doc[prop];
        continue;
      }

      if (propDef.type.indexOf("Collection") === 0) {
        if (propDef.type.indexOf("Collection(Edm") === 0) {
          continue;
        }
        let complexTypeName = propDef.type.replace(
          "Collection(" + model.namespace + ".",
          ""
        );
        complexTypeName = complexTypeName.substring(
          0,
          complexTypeName.length - 1
        );
        const complexType = model.complexTypes[complexTypeName];
        if (!complexType)
          throw new Error(
            "Complex type " + complexTypeName + " was not found."
          );

        for (let i in doc[prop]) {
          this.prune(doc[prop][i], model, complexType);
        }
        continue;
      }

      if (propDef.type.indexOf("Edm") !== 0) {
        const complexTypeName = propDef.type.replace(model.namespace + ".", "");
        const complexType =
          model.complexTypes && model.complexTypes[complexTypeName];
        // if (!complexType)
        // throw new Error("Complex type " + complexTypeName + " was not found.");
        if (complexType) this.prune(doc[prop], model, complexType);
      }
    }
  }
}
