const omelo = require('omelo');
const redisClient = require('../../utils/dbclients').redisClient;
const mysqlClient = require('../../utils/dbclients').mysqlClient;
const queryGameEntry = require('./internal/queryGameEntry');
const utils = require('../../utils/utils');
const serviceCtrl = require('../common/serviceCtrl');

class GateApp {
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

        serviceCtrl.enableSysShutdow();
        logger.info('网关服务启动成功');
    }

    stop() {
        redisClient.stop();
        mysqlClient.stop();
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

module.exports = new GateApp();