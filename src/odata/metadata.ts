/*!
 * Copyright(c) 2016 Acorn IT
 *
 * OData model meta-data serialization (#metadata request)
 */

import * as builder from "xmlbuilder";
import { Util } from "./util";
import { Url } from "url";
import { ODataModel } from "./model";
export interface methodConfig{
  name:"demo";
  definition:{

    description:"atom:title",
    isBound:false,
    type:"action",
  }
  
}

export interface property{
  navigation:true;
  fk:true;
  type: any;
  nullable:false;
  partner:undefined;
  maxLen:1;
  precision:0;
  scale:0;
  unicode:false;
  initial:undefined;

  
}

export class MetadataBuilder {
  private serviceUrl: Url;
  
   
  constructor(serviceUrl: Url) {
    this.serviceUrl = serviceUrl;
  }

  buildCollections(model: ODataModel) {
    let util:Util;
    const xml = builder.create({
      service: {
        "@xmlns": "http://www.w3.org/2007/app",
        "@xmlns:atom": "http://www.w3.org/2005/Atom",
        "@xmlns:m": "http://docs.oasis-open.org/odata/ns/metadata",
        "@xml:base": this.serviceUrl,
        "@m:context": this.serviceUrl + "$metadata",
      },
    });

     const workspaceNode = xml.ele("workspace");

    const namespaces = model.getNamespaces();

    namespaces.forEach(function (namespace:string) {
      const ns = model.getNamespace(namespace);
      ns.namespace = namespace;
      if (ns.entitySets) {
        Object.keys(ns.entitySets).forEach(function (eSet) {
          const set = ns.entitySets[eSet];
          workspaceNode.ele(
            "atom:title",
            {
              type: "text",
            },
            "Default"
          );
          workspaceNode
            .ele("collection", {
              href: eSet,
            })
            .ele(
              "atom:title",
              {
                type: "text",
              },
              set.description || eSet
            );
           
          this.serializeCollectionFnImports(
         util.getMethods(util.getEntityType(eSet, ns), "function"),
            workspaceNode
          );
        });
      }
    });

    xml.end({
      pretty: true,
    });

    return xml.toString();
  }
 

  serializeCollectionFnImports(methods: any[], workspaceNode) {
    methods.forEach(function (method:methodConfig) {
      workspaceNode
        .ele({
          "m:function-import": {
            "@href": method.name,
          },
        })
        .ele("atom:title", {}, method.definition.description || method.name);
    });
  }

  serializeProperty(name:string, property:property, entityNode) {
    if (property.navigation === true) {
      const navNode = entityNode.ele({
        NavigationProperty: {
          "@Name": name,
          "@Type":
            property.fk === true
              ? property.type
              : "Collection(" + property.type + ")",
          "@Nullable": property.nullable === false ? false : true,
        },
      });

      if (property.partner !== undefined)
        navNode.att("Partner", property.partner);
    } else {
      const propNode = entityNode.ele({
        Property: {
          "@Name": name,
          "@Type": property.type,
          "@Nullable": property.nullable === false ? false : true,
        },
      });

      // optional property attributes
      if (
        property.maxLen !== undefined &&
        !isNaN(property.maxLen + 0.0) &&
        property.maxLen > 0
      )
        propNode.att("MaxLength", property.maxLen);
      if (
        property.precision !== undefined &&
        !isNaN(property.precision + 0.0) &&
        property.precision >= 0
      )
        propNode.att("Precision", property.precision);
      if (
        property.scale !== undefined &&
        !isNaN(property.scale + 0.0) &&
        property.scale >= 0
      )
        propNode.att("Scale", property.scale);
      if (property.unicode === false) propNode.att("Unicode", false);
      if (property.initial !== undefined)
        propNode.att("DefaultValue", property.initial);
    }
  }

  serializeEntityNavigations(model: ODataModel, entityType, set:string) {
   
    const xml = builder.create({
      service: {
        "@xmlns": "http://www.w3.org/2007/app",
        "@xmlns:atom": "http://www.w3.org/2005/Atom",
        "@xmlns:m": "http://docs.oasis-open.org/odata/ns/metadata",
        "@xml:base": this.serviceUrl,
        "@m:context": this.serviceUrl + "$metadata",
      },
    });
    const setNode=xml.ele(set);
    for (let propKey in entityType.properties) {
      const property = entityType.properties[propKey];

      if (property.navigation === true) {
        setNode.ele({
          NavigationPropertyBinding: {
            "@Path": propKey,
            "@Target": model.getEntitySet(property.type),
          },
        });
      }
    }
  }

  serializeMethod(method:methodConfig,schemaNode) {
    let util:Util;
    const methodNode =
      method.definition.type === "action"
        ? this.serializeActionNode(method,schemaNode)
        : this.serializeFunctionNode(method, schemaNode);
    const params = util.getMethodParams(method.definition);

    if (methodNode)
      params.forEach(function (param) {
        if (
          param.definition.direction === "in" ||
          param.definition.direction === "inout"
        ) {
          methodNode.ele({
            Parameter: {
              "@Name": param.name,
              "@Type": param.definition.type,
              "@Nullable": param.definition.nullable || false,
            },
          });
        }
      });
  }

  serializeActionNode(method:methodConfig,schema:string ) {
    const xml = builder.create({
      service: {
        "@xmlns": "http://www.w3.org/2007/app",
        "@xmlns:atom": "http://www.w3.org/2005/Atom",
        "@xmlns:m": "http://docs.oasis-open.org/odata/ns/metadata",
        "@xml:base": this.serviceUrl,
        "@m:context": this.serviceUrl + "$metadata",
      },
    });
    const schemaNode=xml.ele(schema)
    const actionNode = schemaNode.ele({
      Action: {
        "@Name": method.name,
        "@IsBound": method.definition.isBound || false,
      },
    });
    return actionNode;
  }

  serializeFunctionNode(method:methodConfig, schema:string) {
    const outParams = [];
    let util:Util;
    const xml = builder.create({
      service: {
        "@xmlns": "http://www.w3.org/2007/app",
        "@xmlns:atom": "http://www.w3.org/2005/Atom",
        "@xmlns:m": "http://docs.oasis-open.org/odata/ns/metadata",
        "@xml:base": this.serviceUrl,
        "@m:context": this.serviceUrl + "$metadata",
      },
    });
     const schemaNode=xml.ele(schema);

    const params = util.getMethodParams(method.definition);
    params.forEach(function (param) {
      if (
        param.definition.direction === "out" ||
        param.definition.direction === "inout"
      )
        outParams.push(param);
    });

    if (outParams.length < 1) return null;

    const functionNode = schemaNode.ele({
      Function: {
        "@Name": method.name,
        "@IsBound": method.definition.isBound || false,
      },
    });

    if (outParams.length === 1) {
      functionNode.ele({
        ReturnType: {
          "@Name": outParams[0].name,
          "@Type": outParams[0].definition.type,
        },
      });
    } else {
      const returnNode = schemaNode.ele({
        ComplexType: {
          "@Name": method.name + "_return",
        },
      });

      outParams.forEach(function (param) {
        returnNode.ele({
          Property: {
            "@Name": param.name,
            "@Type": param.definition.type,
          },
        });
      });

      functionNode.ele({
        ReturnType: {
          "@Name": method.name + "_return",
          "@Type": method.name + "_return",
        },
      });
    }

    return functionNode;
  }

  serializeEntityContainerActions(entityTypes,container:string, namespace) {
    const xml = builder.create({
      service: {
        "@xmlns": "http://www.w3.org/2007/app",
        "@xmlns:atom": "http://www.w3.org/2005/Atom",
        "@xmlns:m": "http://docs.oasis-open.org/odata/ns/metadata",
        "@xml:base": this.serviceUrl,
        "@m:context": this.serviceUrl + "$metadata",
      },
    });
    const containerNode=xml.ele(container);
    Object.keys(entityTypes).forEach(function (type) {
      const actions = this.util.getMethods(entityTypes[type], "action");
      actions.forEach(function (action) {
        containerNode.ele({
          ActionImport: {
            "@Name": action.name,
            "@Action": namespace + "." + type + "." + action.name,
          },
        });
      });
    });
  }

  serializeEntityContainerFunctions(entityTypes,container:string, namespace) {
    const xml = builder.create({
      service: {
        "@xmlns": "http://www.w3.org/2007/app",
        "@xmlns:atom": "http://www.w3.org/2005/Atom",
        "@xmlns:m": "http://docs.oasis-open.org/odata/ns/metadata",
        "@xml:base": this.serviceUrl,
        "@m:context": this.serviceUrl + "$metadata",
      },
    });
    const containerNode=xml.ele(container)
    Object.keys(entityTypes).forEach(function (type) {
      const functions = this.util.getMethods(entityTypes[type], "function");

      functions.forEach(function (func) {
        if (!func.definition.isBound)
          containerNode.ele({
            FunctionImport: {
              "@Name": func.name,
              "@Function": namespace + "." + type + "." + func.name,
            },
          });
      });
    });
  }

  buildSchemaMetadata(schema, schemaN:string, namespace) {
    const xml = builder.create({
      service: {
        "@xmlns": "http://www.w3.org/2007/app",
        "@xmlns:atom": "http://www.w3.org/2005/Atom",
        "@xmlns:m": "http://docs.oasis-open.org/odata/ns/metadata",
        "@xml:base": this.serviceUrl,
        "@m:context": this.serviceUrl + "$metadata",
      },
    });
    const schemaNode=xml.ele(schemaN)
    let util:Util;
    for (const typeKey in schema.getEntityTypes) {
      const entityNode = schemaNode.ele({
        EntityType: {
          "@Name": typeKey,
        },
      });

      if (schema.entityTypes[typeKey].baseType) {
        //if no namespace specified assume same as current schema
        if (schema.entityTypes[typeKey].baseType.split(".").length === 1)
          schema.entityTypes[typeKey].baseType =
            namespace + "." + schema.entityTypes[typeKey].baseType;
        entityNode.att("BaseType", schema.entityTypes[typeKey].baseType);
      }
      if (schema.entityTypes[typeKey].key) {
        const keyNode = entityNode.ele("Key");

        schema.entityTypes[typeKey].key.forEach(function (pkKey) {
          keyNode.ele({
            PropertyRef: {
              "@Name": pkKey,
            },
          });
        });
      } else {
        entityNode.att("Abstract", true);
      }

      for (let propKey in schema.entityTypes[typeKey].properties) {
        this.serializeProperty(
          propKey,
          schema.entityTypes[typeKey].properties[propKey],
          entityNode
        );
      }

      const methods = util.getMethods(schema.entityTypes[typeKey]);
      methods.forEach(function (method:methodConfig) {
        this.serializeMethod(method, schema.entityTypes[typeKey], schemaNode);
      });
    }

    if (schema.complexTypes)
      for (let typeKey in schema.complexTypes) {
        const complexNode = schemaNode.ele({
          ComplexType: {
            "@Name": typeKey,
          },
        });

        const type = schema.complexTypes[typeKey];

        if (type.baseType) {
          if (type.baseType.split(".").length === 1)
            type.baseType = namespace + "." + type.baseType;
          complexNode.att("BaseType", type.baseType);
        }
        for (const propKey in schema.complexTypes[typeKey]) {
          this.serializeProperty(
            propKey,
            schema.complexTypes[typeKey][propKey],
            complexNode
          );
        }
      }

    if (schema.entitySets) {
      const containerNode = schemaNode.ele({
        EntityContainer: {
          "@Name": "DefaultContainer",
        },
      });
      for (const setKey in schema.entitySets) {
        const setNode = containerNode.ele({
          EntitySet: {
            "@EntityType": schema.entitySets[setKey].entityType,
            "@Name": setKey,
          },
        });
        this.serializeEntityNavigations(
          schema.model,
          schema.model.getType(schema.entitySets[setKey].entityType),
          schema,
        );
      }
      this.serializeEntityContainerActions(
        schema.entityTypes,
        schema,
        namespace
      );
      this.serializeEntityContainerFunctions(
        schema.entityTypes,
        schema,
        namespace
      );
    }
  }

  buildMetadata(model: ODataModel) {
    const namespaces = model.getNamespaces();

    const root = builder.create(
      {
        "edmx:Edmx": {
          "@xmlns:edmx": "http://docs.oasis-open.org/odata/ns/edmx",
          "@Version": "4.0",
        },
      },
      {
        version: "1.0",
        encoding: "UTF-8",
        standalone: true,
      }
    );

    const service = root.ele("edmx:DataServices");

    namespaces.forEach(function (ns) {
      const schemaNode = service.ele({
        Schema: {
          "@xmlns": "http://docs.oasis-open.org/odata/ns/edm",
          "@Namespace": ns,
        },
      });

      this.buildSchemaMetadata(model.getNamespace(ns), schemaNode, ns);
    });

    return root.end({
      pretty: true,
    });
  }
}
