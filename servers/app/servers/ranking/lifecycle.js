const rankingApp = require('./rankingApp');

module.exports.beforeStartup = function(app, cb) {
    rankingApp.start();
    cb();
};


module.exports.afterStartup = function(app, cb) {
    cb();
};


module.exports.beforeShutdown = function(app, cb) {
    rankingApp.stop();
    cb();
};

module.exports.afterStartAll = function(app) {
};
