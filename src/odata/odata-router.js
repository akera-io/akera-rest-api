var utils = require('../utils.js');

var metadataBuilder = require('./metadata.js');
var util = require('./util.js');
var odataHandler = require('./odata-handler.js');
var xmlbuilder = require('xmlbuilder');

function ODataRouter(config, router) {
   if (!config.modelPath)
     throw new Error('OData interface specified but no model path provided');
   
   this.model = util.getModels(config.modelPath);
   this.router = router;
   this.httpPrefix = config.route + 'odata/';
   this.broker = router.__broker;
   
   var self = this;
   
   this.checkMetadataBuilder = function(req) {
     if (!this.metadataBuilder) {
       this.serviceUrl = req.protocol + '://' + req.get('host') + self.httpPrefix;
       this.metadataBuilder = new metadataBuilder(this.serviceUrl);
     }
   };
   
   router.use(this.httpPrefix, function(req, res, next) {
     self.checkMetadataBuilder(req);
     req.odataModel = self.model;
     req.serviceUrl = self.serviceUrl;
     self.broker = router.__broker;
     res.odataError = _odataErr;
     next();
   });
   
   router.get(this.httpPrefix, function(req, res) {
     var result = self.metadataBuilder.buildCollections(self.model);
     res.writeHead(200, {'Content-Type': 'application/xml', 'DataServiceVersion': '4.0', 'OData-Version': '4.0'});
     return res.end(result);
  });
   
   router.get(this.httpPrefix + utils.escapeRegExp('$metadata'), function(req, res) {
     var meta = self.metadataBuilder.buildModel(self.model);
     res.writeHead(200, {'Content-Type': 'application/xml', 'DataServiceVersion': '4.0', 'OData-Version': '4.0'});
     res.end(meta);
    });
   
   router.get(this.httpPrefix + ':collection', odataHandler.doRead);
};

function _odataErr(err, statusCode) {
  var rootNode = xmlbuilder.create({
    'm:error': {
      '@xmlns:m': 'http://docs.oasis-open.org/odata/ns/metadata'
    }
  });
  
  rootNode.ele('m:code', {}, statusCode || '500');
  rootNode.ele('m:message', {}, err.message);
  rootNode.ele('stack', {}, err.stack);
  
  rootNode.end();
  this.writeHead(statusCode || 500, {'Content-Type': 'application/xml', 'DataServiceVersion': '4.0', 'OData-Version': '4.0'});
  this.end(rootNode.toString());
}
module.exports = ODataRouter;