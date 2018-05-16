const RankingApp = require('./rankingApp');

module.exports.beforeStartup = async function(app, cb) {
    app.entry = new RankingApp();
    await app.entry.start();
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
