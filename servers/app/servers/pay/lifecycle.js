const payApp = require('./payApp');

module.exports.beforeStartup = function(app, cb) {
    payApp.start();
    cb();
};


module.exports.afterStartup = function(app, cb) {
    cb();
};


module.exports.beforeShutdown = function(app, cb) {
    payApp.stop();
    cb();
};

module.exports.afterStartAll = function(app) {
};
