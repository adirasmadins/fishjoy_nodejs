const eventSyncApp = require('./eventSyncApp');

module.exports.beforeStartup = function(app, cb) {
    eventSyncApp.start();
    cb();
};


module.exports.afterStartup = function(app, cb) {
    cb();
};


module.exports.beforeShutdown = function(app, cb) {
    eventSyncApp.stop();
    cb();
};

module.exports.afterStartAll = function(app) {
};
