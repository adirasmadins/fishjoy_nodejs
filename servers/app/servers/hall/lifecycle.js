const hallApp = require('./hallApp');

module.exports.beforeStartup = function(app, cb) {
    hallApp.start();
    cb();
};


module.exports.afterStartup = function(app, cb) {
    cb();
};


module.exports.beforeShutdown = function(app, cb) {
    hallApp.stop();
    cb();
};

module.exports.afterStartAll = function(app) {
};
