const rankMatchApp = require('./rankMatchApp');

module.exports.beforeStartup = function(app, cb) {
    rankMatchApp.start();
    cb();
};


module.exports.afterStartup = function(app, cb) {
    cb();
};


module.exports.beforeShutdown = function(app, cb) {
    rankMatchApp.stop();
    cb();
};

module.exports.afterStartAll = function(app) {
};
