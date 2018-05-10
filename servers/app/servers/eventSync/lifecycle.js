const EventSyncApp = require('./eventSyncApp');

module.exports.beforeStartup = function(app, cb) {
    app.entry = new EventSyncApp();
    app.entry.start();
    cb();
};


module.exports.afterStartup = function(app, cb) {
    cb();
};


module.exports.beforeShutdown = function(app, cb) {
    app.entry.stop();
    cb();
};

module.exports.afterStartAll = function(app) {
};
