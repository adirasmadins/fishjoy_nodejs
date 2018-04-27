const matchingApp = require('./matchingApp');

module.exports.beforeStartup = function(app, cb) {
    matchingApp.start();
    cb();
};


module.exports.afterStartup = function(app, cb) {
    cb();
};


module.exports.beforeShutdown = function(app, cb) {
    matchingApp.stop();
    cb();
};

module.exports.afterStartAll = function(app) {
};
