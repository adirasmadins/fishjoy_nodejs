const resourceApp = require('./resourceApp');

module.exports.beforeStartup = function(app, cb) {
    resourceApp.start();
    cb();
};


module.exports.afterStartup = function(app, cb) {
    cb();
};


module.exports.beforeShutdown = function(app, cb) {
    resourceApp.stop();
    cb();
};

module.exports.afterStartAll = function(app) {
};
