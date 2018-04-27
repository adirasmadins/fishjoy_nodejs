const loadManagerCmd = require('../../../cmd/loadManagerCmd');
const RemoteHandler = require('../../common/remoteHandler');
const loadManagerApp = require('../loadManagerApp');

function LoadRemote(app) {
    this.app = app;
}

let remote = loadManagerCmd.remote;
for(let k of Object.keys(remote)){
    RemoteHandler.registe(remote[k].route, LoadRemote.prototype, loadManagerApp);
}

module.exports = function (app) {
    return new LoadRemote(app);
};