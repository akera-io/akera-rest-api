module.exports = AkeraRestApi;

var akeraApi = require('akera-api');
var p = akeraApi.call.parameter;
var akeraApp = null;

function AkeraRestApi(akeraWebApp) {
  var self = this;

  this.error = function(err, res) {
    if (err) {
      if (err instanceof Error) {
        err = err.message;
      }

      res.status(500).send({
          message : err
      });
      
      akeraApp.log('error', err);
    }
  };

  this.handleRequest = function(req, res) {
    var broker = req.broker;
    var callInfo = req.body.call;

    if (!callInfo || !callInfo.procedure) {
      self.error('Invalid or no procedure details specified.', res, akeraApp);
      return;
    }

    try {
      akeraApi.connect(broker).then(function(conn) {
        try {
          var call = conn.call.procedure(callInfo.procedure);

          if (callInfo.parameters instanceof Array) {
            var parameters = [];

            callInfo.parameters.forEach(function(param) {

              param.dataType = param.dataType || 'character';
              param.dataType = param.dataType.toLowerCase();

              switch (param.type) {
              case 'inout':
                parameters.push(p.inout(param.value, param.dataType));
                break;
              case 'output':
                parameters.push(p.output(param.dataType));
                break;
              default:
                parameters.push(p.input(param.value, param.dataType));
              }
            });

            call.parameters.apply(call, parameters);
          }

          call.run().then(function(response) {
            conn.disconnect();
            res.status(200).send(response);
          }, function(err) {
            conn.disconnect();
            self.error(err, res, akeraApp);
          });
        } catch (err) {
          self.error(err, res, akeraApp);
        }
      }, function(err) {
        self.error(err, res, akeraApp);
      });
    } catch (err) {
      self.error(err, res, akeraApp);
    }
  };

  this.init = function(config, router) {

    if (!router || !router.__app || typeof router.__app.require !== 'function') {
      throw new Error('Invalid Akera web service router.');
    }

    config = config || {};
    akeraApp = router.__app;
    config.route = akeraApp.getRoute(config.route || '/rest/api/');

    router.post(config.route, self.handleRequest);
    router.get(config.route, self.handleRequest);

  };

  if (akeraWebApp !== undefined) {
    throw new Error('Rest API service can only be mounted at the broker level.');
  }
}

AkeraRestApi.init = function(config, router) {
  var akeraRestApi = new AkeraRestApi();
  akeraRestApi.init(config, router);
};
