const omelo = require('omelo');
const redisClient = require('../../utils/dbclients').redisClient;
const mysqlClient = require('../../utils/dbclients').mysqlClient;
const GAME_TYPE = require('../../utils/imports').sysConfig.GAME_TYPE;
const plugins = require('../../plugins');
const globalStatusData = require('../../utils/globalStatusData');

class RankMatchApp {
    constructor(){
        this._instance = new plugins[GAME_TYPE].MatchRankInstance();
    }
    async start() {
        let result = await redisClient.start(omelo.app.get('redis'));
        if (!result) {
            process.exit(0);
            return;
        }
        result = await mysqlClient.start(omelo.app.get('mysql'));
        if (!result) {
            process.exit(0);
            return;
        }
        omelo.app.rankMatch = this;
        this._instance.start();

        let serverId = omelo.app.getServerId();
        let splits = serverId.split('-');
        
        global.SERVER_ID = `${splits[1]}${splits[2]}`;
        globalStatusData.clean();
        logger.info('排位赛比赛服启动成功');
    }

    stop() {
        this._instance.stop();
        redisClient.stop();
        mysqlClient.stop();
        globalStatusData.clean();
        logger.info('排位赛比赛服关闭');
    }

    remoteRpc(method, data, cb) {
        this._instance.remoteRpc(method, data, cb);
    }

    getLoadInfo() {
        return this._instance.getLoadStatistics();
    }
}

module.exports = new RankMatchApp();