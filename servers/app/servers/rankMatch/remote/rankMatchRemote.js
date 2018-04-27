const rankMatchCmd = require('../../../cmd/rankMatchCmd');
const RemoteHandler = require('../../common/remoteHandler');
const rankMatchApp = require('../rankMatchApp');

/**
 * 排位赛远程调用接口
 * @param app
 * @constructor
 */

function RankMatchRemote(app) {
    this.app = app;
}

let remote = rankMatchCmd.remote;
for(let k of Object.keys(remote)){
    RemoteHandler.registe(remote[k].route, RankMatchRemote.prototype, rankMatchApp);
}

module.exports = function (app) {
    return new RankMatchRemote(app);
};