const gateApp = require('./gateApp');

module.exports.beforeStartup = function(app, cb) {
    gateApp.start();
    cb();
};


module.exports.afterStartup = function(app, cb) {
    cb();
};


module.exports.beforeShutdown = function(app, cb) {
    gateApp.stop();
    cb();
};

module.exports.afterStartAll = function(app) {
};
