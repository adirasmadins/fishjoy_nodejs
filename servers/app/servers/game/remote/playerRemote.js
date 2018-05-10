const fishCmd = require('../../../cmd/fishCmd');
const RemoteHandler = require('../../common/remoteHandler');
const omelo = require('omelo');

function PlayerRemote(app) {
    this.app = app;
}

let remote = fishCmd.remote;
for(let k of Object.keys(remote)){
    RemoteHandler.registe(remote[k].route, PlayerRemote.prototype, omelo.app.entry);
}

module.exports = function (app) {
    return new PlayerRemote(app);
};