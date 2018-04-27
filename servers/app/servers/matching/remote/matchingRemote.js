
const RemoteHandler = require('../../common/remoteHandler');
const matchingCmd = require('../../../cmd/matchingCmd');
const matchingApp = require('../matchingApp');

/**
 * 排位赛远程调用接口
 * @param app
 * @constructor
 */

function matchingRemote(app) {
    this.app = app;
}

let remote = matchingCmd.remote;
for(let k of Object.keys(remote)){
    RemoteHandler.registe(remote[k].route, matchingRemote.prototype, matchingApp);
}

module.exports = function (app) {
    return new matchingRemote(app);
};