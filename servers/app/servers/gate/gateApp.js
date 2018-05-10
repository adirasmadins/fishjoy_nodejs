const omelo = require('omelo');
const {RedisConnector, MysqlConnector} = require('../../database/dbclient');
const queryGameEntry = require('./internal/queryGameEntry');
const utils = require('../../utils/utils');
const serviceCtrl = require('../common/serviceCtrl');

class GateApp {
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

        serviceCtrl.enableSysShutdow();
        logger.info('网关服务启动成功');
    }

    stop() {
        redisConnector.stop();
        mysqlConnector.stop();
        logger.info('网关服务已经停止');
    }

    request(route, msg, session, cb) {
        this[route](msg, session, cb);
    }

    async c_query_entry(msg, session, cb) {
        try {
            let entry = await queryGameEntry.getEntry(msg);
            utils.invokeCallback(cb, null, entry);
        }catch(e){
            utils.invokeCallback(cb, e);
        }
    }

}

module.exports = GateApp;