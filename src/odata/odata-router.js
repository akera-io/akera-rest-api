var utils = require('../utils.js');
var collections = require("./collections.js");

var metadata = require('./metadata.js');
var util = require('./util.js');

function ODataRouter(config, router) {
   if (!config.modelPath)
     throw new Error('OData interface specified but no model path provided');
   
   this.model = util.getModels(config.modelPath);
   this.router = router;
   this.serviceUrl = config.route + 'odata/';
   
   router.get(this.serviceUrl, function(req, res) {
     var result = collections(model, req.protocol + '://' + req.get('host') + req.originalUrl);
     res.writeHead(200, {'Content-Type': 'application/xml', 'DataServiceVersion': '4.0', 'OData-Version': '4.0'});
     return res.end(result);
  });
   
   router.get(this.serviceUrl + utils.escapeRegExp('$metadata'), function(req, res) {
     var meta = metadata(model);
     res.writeHead(200, {'Content-Type': 'application/xml', 'DataServiceVersion': '4.0', 'OData-Version': '4.0'});
     res.end(meta);
    }); 
};

module.exports = ODataRouter;