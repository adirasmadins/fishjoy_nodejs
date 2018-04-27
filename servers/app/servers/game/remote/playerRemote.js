const fishCmd = require('../../../cmd/fishCmd');
const RemoteHandler = require('../../common/remoteHandler');
const gameApp = require('../gameApp');

function PlayerRemote(app) {
    this.app = app;
}

let remote = fishCmd.remote;
for(let k of Object.keys(remote)){
    RemoteHandler.registe(remote[k].route, PlayerRemote.prototype, gameApp);
}

module.exports = function (app) {
    return new PlayerRemote(app);
};