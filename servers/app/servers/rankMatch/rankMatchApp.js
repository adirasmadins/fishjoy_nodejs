const omelo = require('omelo');
const {RedisConnector, MysqlConnector} = require('../../database/dbclient');
const GAME_TYPE = require('../../utils/imports').sysConfig.GAME_TYPE;
const plugins = require('../../plugins');
const globalStatusData = require('../../utils/globalStatusData');

class RankMatchApp {
    constructor(){
        this._instance = new plugins[GAME_TYPE].MatchRankInstance();
    }
    async start() {
        this._redisConnector = new RedisConnector();
        let result = await this._redisConnector.start(omelo.app.get('redis'));
        if (!result) {
            process.exit(0);
            return;
        }
        this._mysqlConnector = new MysqlConnector();
        result = await this._mysqlConnector.start(omelo.app.get('mysql'));
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
        redisConnector.stop();
        mysqlConnector.stop();
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

module.exports = RankMatchApp;