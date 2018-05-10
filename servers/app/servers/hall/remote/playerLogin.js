const hallCmd = require('../../../cmd/hallCmd');
const RemoteHandler = require('../../common/remoteHandler');
const omelo = require('omelo');

function PlayerLogin(app) {
    this.app = app;
}

let remote = hallCmd.remote;
for(let k of Object.keys(remote)){
    RemoteHandler.registe(remote[k].route, PlayerLogin.prototype, omelo.app.entry);
}

module.exports = function (app) {
    return new PlayerLogin(app);
};