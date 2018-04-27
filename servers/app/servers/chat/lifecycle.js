const chatApp = require('./chatApp');

module.exports.beforeStartup = function(app, cb) {
    chatApp.start();
    cb();
};


module.exports.afterStartup = function(app, cb) {
    cb();
};


module.exports.beforeShutdown = function(app, cb) {
    chatApp.stop();
    cb();
};

module.exports.afterStartAll = function(app) {
};
