var utils = require('../utils.js');
var collections = require("./collections.js");
var query = require("./query.js");
var insert = require("./insert.js");
var update = require("./update.js");
var remove = require("./remove.js");
var Router = require("./router.js");
var prune = require("./prune.js");

var akeraAdapter = require('./akeraAdapter.js');
var akeraApi = require('akera-api');

function ODataRouter(baseRoute, model, router) {
   this.router = router;
   this.cfg = {model: model.modelDefinition, serviceUrl: baseRoute + 'odata/', pruneResults: prune, base64ToBuffer: function(model, collection, doc) {
   //  var model = model;
     var entitySet = model.entitySets[collection];
     var entityType = model.entityTypes[entitySet.entityType.replace(model.namespace + ".", "")];

     for (var prop in doc) {
         if (!prop)
             continue;

         var propDef = entityType[prop];

         if (!propDef)
             continue;

         if (propDef.type === "Edm.Binary") {
             doc[prop] = new Buffer(doc[prop], 'base64');
         }
     }
 },
 bufferToBase64: function(model, collection, res) {
   
   var entitySet = model.entitySets[collection];
   var entityType = model.entityTypes[entitySet.entityType.replace(model.namespace + ".", "")];

   for (var i in res) {
       var doc = res[i];
       for (var prop in doc) {
           if (!prop)
               continue;

           var propDef = entityType[prop];

           if (!propDef)
               continue;

           if (propDef.type === "Edm.Binary") {
               //nedb returns object instead of buffer on node 4
               if (!Buffer.isBuffer(doc[prop]) && !doc[prop].length) {
                   var obj = doc[prop];
                   obj = obj.data || obj;
                   doc[prop] = Object.keys(obj).map(function (key) {return obj[key]; });
               }

               //unwrap mongo style buffers
               if (doc[prop]._bsontype === "Binary") {
                   doc[prop] = doc[prop].buffer;
               }

               doc[prop] = new Buffer(doc[prop]).toString("base64");
           }
       }
   }
}
};
   var self = this;
   /*this.cfg = {
       afterRead: function() {},
       beforeQuery: function(col, query, req, cb) { cb();},
       executeQuery: ODataServer.prototype.executeQuery.bind(this),
       beforeInsert: function(col, query, req, cb) { cb();},
       executeInsert: ODataServer.prototype.executeInsert.bind(this),
       beforeUpdate: function(col, query, update, req, cb) { cb();},
       executeUpdate: ODataServer.prototype.executeUpdate.bind(this),
       beforeRemove: function(col, query, req, cb) { cb();},
       executeRemove: ODataServer.prototype.executeRemove.bind(this),
       base64ToBuffer: ODataServer.prototype.base64ToBuffer.bind(this),
       bufferToBase64: ODataServer.prototype.bufferToBase64.bind(this),
       pruneResults: ODataServer.prototype.pruneResults.bind(this)
   };*/
   
   akeraAdapter(this, function(collection, cb) {
     console.log(self.router.__broker);
     akeraApi.connect(self.router.__broker).then(function(conn) {
       console.log('got akera connection');
       cb(null, conn);
     }, function(err) {
       console.log(err);
       cb(err);
     });
   });
   
    router.get(self.cfg.serviceUrl + ":collection/" + utils.escapeRegExp("$count/"), function(req, res) {
     req.params.$count = true;
     query(self.cfg, req, res);
    });
    router.get(self.cfg.serviceUrl + ":collection\\(:id\\)", function(req, res) {
       query(self.cfg, req, res);
    });
    console.log(self.cfg.serviceUrl + ':collection');
    router.get(self.cfg.serviceUrl + ":collection", function(req, res) {
      console.log('general query');
       query(self.cfg, req, res);
    });
    
    router.get(self.cfg.serviceUrl, function(req, res) {
       var result = collections(self.cfg, req.protocol + '://' + req.get('host') + req.originalUrl);
       //console.log(result);
       res.writeHead(200, {'Content-Type': 'application/xml', 'DataServiceVersion': '4.0', 'OData-Version': '4.0'});
       return res.end(result);
    });
    
    router.post(self.cfg.serviceUrl + ":collection", function(req, res) {
       insert(self.cfg, req, res);
    });
    router.patch(self.cfg.serviceUrl + ":collection\\(:id\\)", function(req, res) {
       update(self.cfg, req, res);
    });
    router.delete(self.cfg.serviceUrl + ":collection\\(:id\\)", function(req, res) {
       remove(self.cfg, req, res);
    });
};

module.exports = ODataRouter;