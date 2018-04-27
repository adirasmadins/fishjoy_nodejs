const omelo = require('omelo');
const plugins = require('../../plugins');
const redisClient = require('../../utils/dbclients').redisClient;
const mysqlClient = require('../../utils/dbclients').mysqlClient;
const GAME_TYPE = require('../../utils/imports').sysConfig.GAME_TYPE;
const serviceCtrl = require('../common/serviceCtrl');
/**
 * 排位赛匹配服
 * 处理全服玩家匹配
 */
class MatchingApp {
    constructor(){
        this._instance = null;
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
        omelo.app.matching = this;
        this._instance = new plugins[GAME_TYPE].MatchingInstance();
        this._instance.start();
        serviceCtrl.enableSysShutdow();
        
        logger.info('排位赛匹配服启动成功');
    }

    stop() {
        this._instance.stop();
        redisClient.stop();
        mysqlClient.stop();
        logger.info('排位赛匹配服关闭');
    }

    request(route, msg, session, cb) {
        this._instance.request(route, msg, session, cb);
    }

    remoteRpc(method, data, cb) {
        this._instance.remoteRpc(method, data, cb);
    }
}

module.exports = new MatchingApp();