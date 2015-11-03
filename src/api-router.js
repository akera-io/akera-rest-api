var express = require('express');
var akeraApi = require('akera-api');
var p = akeraApi.call.parameter;

function getMiddleware(brokerName, akeraWebInstance) {
    var router = express.Router({
        mergeParams: true
    });

    router.post('/api', function(req, res) {
        if (!req.body.call) {
            res.status(500).send({
                mesasge: 'Invalid or no procedure details specified.'
            });
            return;
        }
        brokerName = req.params.broker || brokerName;
        var broker = akeraWebInstance.getBroker(brokerName);

        akeraApi.connect(broker).then(function(conn) {
                try {
                    var call = conn.call.procedure(req.body.call.procedure);
                    var parameters = [];
                    req.body.call.parameters.forEach(function(param) {
                        param.dataType = param.dataType.toLowerCase();
                        var aP = null;
                        switch (param.type) {
                            case 'input':
                                aP = p.input(param.value, param.dataType);
                                break;
                            case 'output':
                                aP = p.output(param.dataType);
                                break;
                        }
                        parameters.push(aP);
                    });
                    call.parameters.apply(call, parameters).run().then(function(response) {
                        res.status(200).send(response);
                    }, function(err) {
                        akeraWebInstance.log('error', err.message);
                        res.status(500).send(err);
                    });
                } catch (err) {
                    akeraWebInstance.log('error', err.message);
                    res.status(500).send(err);
                }
            },
            function(err) {
                akeraWebInstance.log('error', err.message);
                res.status(500).send(err);
            });
    });
    return router;
}

module.exports = getMiddleware;
