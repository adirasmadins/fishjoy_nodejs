const adminApp = require('./adminApp');

module.exports.beforeStartup = function(app, cb) {
    adminApp.start();
    cb();
};


module.exports.afterStartup = function(app, cb) {
    cb();
};


module.exports.beforeShutdown = function(app, cb) {
    adminApp.stop();
    cb();
};

module.exports.afterStartAll = function(app) {
};
