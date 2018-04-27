const gameApp = require('./gameApp');

module.exports.beforeStartup = function(app, cb) {
    gameApp.start();
    cb();
};


module.exports.afterStartup = function(app, cb) {
    cb();
};


module.exports.beforeShutdown = function(app, cb) {
    gameApp.stop();
    cb();
};

module.exports.afterStartAll = function(app) {
};
