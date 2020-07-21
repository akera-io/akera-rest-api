
const oDataTypeMap = {
    character : 'Edm.String',
    integer : 'Edm.Int32',
    logical : 'Edm.Boolean',
    datetime : 'Edm.DateTime',
    datetimetz : 'Edm.DateTime',
    decimal : 'Edm.Decimal',
    blob : 'Edm.Binary',
    float : 'Edm.Float',
    timestamp : 'Edm.DateTime'
  };

export class ODataModel {
   model = null;
  definition:string;
  


    public checkLoaded(namespace: string | number) {
    if (!this.model) {
      throw new Error('Model not loaded.');
    }

    if (!this.model.schemas[namespace]) {
      throw new Error('Namespace not found in model definition.');
    }
  };

  parseRelations() {
    if (this.model && this.model.entityRelations) {
      this.model.entityRelations.filter(function(rel) {
        return !rel.__processed;
      }).forEach(
          function(rel) {
            let parent = null;
            let child = null;

            try {
              parent = this.getType(rel.from);
              child = this.getType(rel.to);
            } catch (e) {
              // one of the relation's ends was not loaded yet
              return;
            }

            // first add navigation property in parent
            if (rel.name) {
              if (parent.properties[rel.name])
                throw new Error('Property already defined: ' + rel.name
                    + ' on ' + rel.from);

              parent.properties[rel.name] = {
                type : rel.to,
                partner : rel.partner,
                navigation : true,
                nullable : rel.nullable || false,
                onDelete : rel.onDelete || 'None'
              };

              if (rel.constraints)
                parent.properties[rel.name].constraints = rel.constraints;
            }

            // add navigation property in child
            if (rel.partner) {

              if (child.properties[rel.partner])
                throw new Error('Property already defined: ' + rel.partner
                    + ' on ' + rel.to);

              child.properties[rel.partner] = {
                type : rel.from,
                partner : rel.name,
                navigation : true,
                fk : true
              };

              if (rel.constraints)
                child.properties[rel.partner].constraints = rel.constraints;
            }

            rel.__processed = true;

          });
    }

  };

   getNamespaces() {
    return this.model ? Object.keys(this.model.schemas) : [];
  };

    getNamespace(namespace:string) {
    this.checkLoaded(namespace);

    return this.model.schemas[namespace];
  };

  hasNamespace(fullName:string) {
    return (fullName && fullName.indexOf('.') != -1);
  };

  getFullName(name:string, namespace:string) {
    return name && !this.hasNamespace(name) && namespace ? namespace + '.'
        + name : name;
  };

  getClassInfo(fullName:string, namespace:string) {
    if (this.hasNamespace(fullName)) {
      const idx = fullName.lastIndexOf('.');

      return {
        namespace : fullName.substring(0, idx),
        name : fullName.substr(idx + 1)
      };

    }

    return {
      name : fullName,
      namespace : namespace
    };
  };

    typeEntity(definition: { namespace: string | number; entityTypes: { [x: string]: any; }; entitySets: { [x: string]: any; }; entityRelations: any[]; }) {
    if (definition && definition.namespace) {
      if (!this.model)
        this.model = {
          schemas : {}
        };

      if (this.model.schemas[definition.namespace]) {
        throw new Error('Namespace already loaded.');
      }

      this.model.schemas[definition.namespace] = {
        model : this
      };

      const schema = this.model.schemas[definition.namespace];

      if (definition.entityTypes) {
        schema.entityTypes = {};

        Object.keys(definition.entityTypes).forEach(
            function(key) {
              // if not fully qualified type assume same namespace
              if (this.hasNamespace(key)) {
                throw new Error(
                    'Types can only be defined within the same namespace: '
                        + key);
              }

              schema.entityTypes[key] = definition.entityTypes[key];

            });
      }

      if (definition.entitySets) {
        schema.entitySets = {};

        Object.keys(definition.entitySets).forEach(
            function(key) {
              const entity = definition.entitySets[key];

              // if not fully qualified type assume same namespace
              entity.entityType = this.getFullName(entity.entityType,
                  definition.namespace);

              schema.entitySets[key] = entity;
            });
      }

      if (definition.entityRelations) {
        // relations can well be from different namespaces
        if (!this.model.entityRelations)
          this.model.entityRelations = [];

        definition.entityRelations
            .forEach(function(relation) {
              // if not fully qualified type assume same namespace
              relation.from = this.getFullName(relation.from,
                  definition.namespace);
              relation.to = this.getFullName(relation.to, definition.namespace);

              this.model.entityRelations.push(relation);
            });

        this.parseRelations();
      }
      
    } else {
      throw new Error('Invalid oData model definition.');
    }
  };

   getEntity (name?: string, namespace?:string) {
    const info = this.getClassInfo(name, namespace);

    this.checkLoaded(info.namespace);

    if (!this.model.schemas[info.namespace].entitySets
        || !this.model.schemas[info.namespace].entitySets[info.name]) {
      throw new Error('Entity not found in model definition: '
          + this.getFullName(info.name, info.namespace));
    }

    return this.model.schemas[info.namespace].entitySets[info.name];

  };

   getType (name: string, namespace: string) {

    const info = this.getClassInfo(name, namespace);

    this.checkLoaded(info.namespace);

    if (!this.model.schemas[info.namespace].entityTypes
        || !this.model.schemas[info.namespace].entityTypes[info.name]) {
      throw new Error('Type not found in model definition: '
          + this.getFullName(info.name, info.namespace));
    }

    return this.model.schemas[info.namespace].entityTypes[info.name];
  };

   getEntityType = function(name:string, namespace?:string) {
    const info = this.getClassInfo(name, namespace);

    this.checkLoaded(info.namespace);

    const type = this
        .getClassInfo(this.getEntity(info.name, info.namespace).entityType);

    return this.getType(type.name, type.namespace);
  };

  getEntitySet (name: string, namespace?: string) {

    const info = this.getClassInfo(name, namespace);

    this.checkLoaded(info.namespace);

    name = this.getFullName(info.name, info.namespace);

    if (this.model.schemas[info.namespace].entitySets) {
      for ( const eSet in this.model.schemas[info.namespace].entitySets) {
        if (this.model.schemas[info.namespace].entitySets[eSet].entityType === name)
          return eSet;
      }
    }

    throw new Error('No set defined for type in model definition: ' + name);
  };

   getPrimaryKey(name: string, namespace: string) {
    const keys = this.getEntityType(name, namespace).key;

    switch (keys.length) {
    case 0:
      return null
    case 1:
      return keys[0];
    default:
      return keys;
    }
  };

 
}