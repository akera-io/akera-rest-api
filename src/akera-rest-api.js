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

  this.getModelRoute = function(baseRoute, model) {
    return baseRoute + '/' + model.name;
  };

  this.handleRequest = function(req, res) {
    var broker = req.broker;
    var callProc = null;
    var callParams = null;

    if (req.method === 'GET') {
      callProc = req.query.procedure;
      if (req.query.parameters) {
        try {
          callParams = JSON.parse(req.query.parameters);
        } catch (err) {
          return self.error(
            'Invalid procedure parameters format, must be a JSON array.', res,
            akeraApp);
        }
      }
    } else {
      callProc = req.body.procedure || req.body.call && req.body.call.procedure;
      callParams = req.body.parameters || req.body.call
        && req.body.call.parameters;
    }

    if (!callProc) {
      return self.error('Invalid or no procedure details specified.', res,
        akeraApp);
    }

    try {
      akeraApi
        .connect(broker)
        .then(
          function(conn) {
            try {
              var call = conn.call.procedure(callProc);

              if (callParams instanceof Array) {
                var parameters = [];

                callParams
                  .forEach(function(param) {

                    var direction = param.type || 'i';

                    param.type = typeof param.dataType === 'string' ? param.dataType
                      .toLowerCase()
                      : p.data_type.character;

                    delete param.dataType;

                    switch (direction) {
                      case 'io':
                      case 'inout':
                      case 'input-output':
                        parameters.push(p.inout(param));
                        break;
                      case 'o':
                      case 'out':
                      case 'output':
                        parameters.push(p.output(param));
                        break;
                      default:
                        parameters.push(p.input(param));
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

  this.setupInterface = function(type, config, router) {
    type = type || 'rest';

    switch (type) { // TODO: support rest and jsdo interfaces
      case 'odata':
        var odataRouter = require('./odata/odata-router.js');
        odataRouter(config, router);
        break;
      case 'rest':
        router.post(config.route, self.handleRequest);
        router.get(config.route, self.handleRequest);
        break;
      default:
        throw new Error('Invalid api interface specified');
    }
  };

  this.init = function(config, router) {

    if (!router || !router.__app || typeof router.__app.require !== 'function')
    {
      throw new Error('Invalid Akera web service router.');
    }

    config = config || {};
    akeraApp = router.__app;
    config.route = akeraApp.getRoute(config.route || '/rest/api/');

    if (config.serviceInterface instanceof Array) {
      config.serviceInterface.forEach(function(interfaceName) {
        self.setupInterface(interfaceName, config, router);
      });
    } else {
      self.setupInterface(config.serviceInterface, config, router);
    }
  };

  if (akeraWebApp !== undefined) {
    throw new Error('Rest API service can only be mounted at the broker level.');
  }
}

AkeraRestApi.init = function(config, router) {
  var akeraRestApi = new AkeraRestApi();
  akeraRestApi.init(config, router);
};

function setupModels(modelPath, route, router) {

}
