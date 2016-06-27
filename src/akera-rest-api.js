module.exports = AkeraRestApi;
var utils = require('./utils.js');

var express = require('express');

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
  
  this.setupModels = function(config, router) {
    var modelPath = config.modelPath;
    var route = config.route;
    var models = utils.getModels(modelPath);
    router.get(route + utils.escapeRegExp('$metadata'), function(req, res) {
        var meta = utils.getOdataMeta(utils.getOdataModel(models, router.__broker));
        res.writeHead(200, {'Content-Type': 'application/xml', 'DataServiceVersion': '4.0', 'OData-Version': '4.0'});
        res.end(meta);
    });

    models.forEach(function(model) {
      var modelInstance = utils.getModelClass(modelPath, model, router.__broker);
      
      if (model.methods)
        model.methods.forEach(function(method) {
          var httpMethod = method.httpMethod || 'get';
          router[httpMethod](route + model.name + '/' + method.name, function(req, res, next) {
            var paramValues = [];  
            method.params.forEach(function(param) {
                if (param.direction === 'in' || param.direction === 'inout') {
                  var source = param.source || 'query';
                  var value = req[source][param.name] || null;
                  paramValues.push(value);
                }
             });
            paramValues.push(function(err, result) {
              if (err) {
                res.status(500).json({
                  message: err.message,
                  stack: err.stack
                });
              } else {
                res.status(200).json(result);
              }
            });
            modelInstance[method.name].apply(modelInstance, paramValues);
          });
        });
    });
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
          return self.error('Invalid procedure parameters format, must be a JSON array.', res, akeraApp);
        }
      }
    } else {
      callProc = req.body.procedure || req.body.call && req.body.call.procedure;
      callParams = req.body.parameters || req.body.call && req.body.call.parameters;
    }
    
    if (!callProc) {
      return self.error('Invalid or no procedure details specified.', res, akeraApp);
    }

    try {
      akeraApi.connect(broker).then(function(conn) {
        try {
          var call = conn.call.procedure(callProc);

          if (callParams instanceof Array) {
            var parameters = [];

            callParams.forEach(function(param) {

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
    
    if (config.modelPath) {
      self.setupModels(config, router);
    }
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

function setupModels(modelPath, route, router) {
  
}