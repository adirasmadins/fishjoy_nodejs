const omelo = require('omelo');
const redisClient = require('../../utils/dbclients').redisClient;
const mysqlClient = require('../../utils/dbclients').mysqlClient;
const feedback = require('./src/buzz/feedback');
const buzz_redis = require('./src/buzz/buzz_redis');
const serviceCtrl = require('../common/serviceCtrl');

class ChatApp {
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
        this._init();
        logger.info('聊天服务启动成功');
    }

    stop() {
        redisClient.stop();
        mysqlClient.stop();
        logger.info('聊天服务关闭');
    }

    _init(){
        buzz_redis.addListener();
        feedback.init();
    }
}

module.exports = new ChatApp();