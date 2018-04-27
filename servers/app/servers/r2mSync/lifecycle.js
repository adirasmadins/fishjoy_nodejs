const r2mSyncApp = require('./r2mSyncApp');

module.exports.beforeStartup = function(app, cb) {
    r2mSyncApp.start();
    cb();
};


module.exports.afterStartup = function(app, cb) {
    cb();
};


module.exports.beforeShutdown = function(app, cb) {
    r2mSyncApp.stop();
    cb();
};

module.exports.afterStartAll = function(app) {
};
