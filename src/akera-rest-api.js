module.exports = AkeraApi;

var api_router = require('./api-router.js');

function AkeraApi(akeraWebInstance) {
    if (akeraWebInstance && akeraWebInstance.app) {
        this.akeraWebInstance = akeraWebInstance;
    } else {
        throw new Error('Invalid akera web application instance');
    }
}

AkeraApi.prototype.init = function(brokerName, route) {
    var app = this.akeraWebInstance.app;

    route = (route === '/' ? '/rest' : route) || this.akeraWebInstance.akeraServices.restRoute || '/rest';

    app.use(route + (brokerName ? '/' + brokerName : '/:broker'), new api_router(brokerName || null, this.akeraWebInstance));
    this.log('info', 'Akera API Service enabled for all brokers.');
};

AkeraApi.prototype.log = function(level, message) {
    try {
        this.akeraWebInstance.log(level, message);
    } catch (err) {}
};
