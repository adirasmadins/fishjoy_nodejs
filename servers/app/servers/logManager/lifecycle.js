const logManagerApp = require('./logManagerApp');

module.exports.beforeStartup = function(app, cb) {
    logManagerApp.start();
    cb();
};


module.exports.afterStartup = function(app, cb) {
    cb();
};


module.exports.beforeShutdown = function(app, cb) {
    logManagerApp.stop();
    cb();
};

module.exports.afterStartAll = function(app) {
};
