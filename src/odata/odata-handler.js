var UpdatableBusinessEntity = require('./model/UpdatableBusinessEntity.js');
var readHelper = require('./crud/read.js');

module.exports = {
  doRead : function(req, res) {
    var bs = new UpdatableBusinessEntity();
    var odataQuery = readHelper.getQuery(req);
    odataQuery.model = req.odataModel;

    bs.read(odataQuery, req.broker, function(err, result) {
      if (err) {
        res.odataError(err, 404);
      } else {
        res.writeHead(200, {
          'Content-Type' : 'application/json',
          'OData-Version' : '4.0'
        });

        var out = {
          "@odata.context" : req.serviceUrl + "$metadata#" + req.params.collection,
          "value" : result
        };

        if (odataQuery.$inlinecount) {
          out["@odata.count"] = result.length;
          out.value = result;
        }

        res.end(JSON.stringify(out));
      }
    });
  },
  doCreate : function(req, res) {
  },
  doDelete : function(req, res) {
  },
  doUpdate : function(req, res) {
  }
};