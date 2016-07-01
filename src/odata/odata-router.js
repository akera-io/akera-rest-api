var utils = require('../utils.js');

var metadataBuilder = require('./metadata.js');
var util = require('./util.js');

function ODataRouter(config, router) {
   if (!config.modelPath)
     throw new Error('OData interface specified but no model path provided');
   
   this.model = util.getModels(config.modelPath);
   this.router = router;
   this.httpPrefix = config.route + 'odata/';
   
   var self = this;
   
   this.checkMetadataBuilder = function(req) {
     if (!this.metadataBuilder) {
       this.serviceUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
       this.metadataBuilder = new metadataBuilder(this.serviceUrl);
     }
   };
   
   router.get(this.httpPrefix, function(req, res) {
     self.checkMetadataBuilder(req);
     var result = self.metadataBuilder.buildCollections(self.model);
     res.writeHead(200, {'Content-Type': 'application/xml', 'DataServiceVersion': '4.0', 'OData-Version': '4.0'});
     return res.end(result);
  });
   
   router.get(this.httpPrefix + utils.escapeRegExp('$metadata'), function(req, res) {
     self.checkMetadataBuilder(req);
     var meta = self.metadataBuilder.buildModel(self.model);
     res.writeHead(200, {'Content-Type': 'application/xml', 'DataServiceVersion': '4.0', 'OData-Version': '4.0'});
     res.end(meta);
    }); 
};

module.exports = ODataRouter;