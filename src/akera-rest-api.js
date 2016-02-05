module.exports = AkeraApi;

var api_router = require('./api-router.js');

function AkeraApi() {
    
}

AkeraApi.prototype.init = function(config, router) {
    api_router(config, router);
};

