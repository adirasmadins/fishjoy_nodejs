const omelo = require('omelo');
const {RedisConnector, MysqlConnector} = require('../../database/dbclient');
const feedback = require('./src/buzz/feedback');
const buzz_redis = require('./src/buzz/buzz_redis');
const serviceCtrl = require('../common/serviceCtrl');

class ChatApp {
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
        this._init();
        logger.info('聊天服务启动成功');
    }

    stop() {
        redisConnector.stop();
        mysqlConnector.stop();
        logger.info('聊天服务关闭');
    }

    _init(){
        buzz_redis.addListener();
        feedback.init();
    }
}

module.exports = ChatApp;