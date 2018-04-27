const loadManagerApp = require('./loadManagerApp');

module.exports.beforeStartup = function(app, cb) {
    loadManagerApp.start();
    cb();
};

module.exports.afterStartup = function(app, cb) {
    cb();
};

module.exports.beforeShutdown = function(app, cb) {
    loadManagerApp.stop();
    cb();
};

module.exports.afterStartAll = function(app) {
};
