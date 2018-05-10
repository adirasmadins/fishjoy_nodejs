const omelo = require('omelo');
const {RedisConnector, MysqlConnector} = require('../../database/dbclient');
const pumpwater = require('./pumpwater');
//TODO: const timeSyc = require('./timeSyc');

class EventSyncApp {
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

        pumpwater.start();
        // timeSyc.start();

        logger.info('数据同步服启动成功');
    }

    stop() {
        mysqlConnector.stop();
        redisConnector.stop();
        // timeSyc.stop();
        logger.info('数据同步服关闭');
    }
}

module.exports = EventSyncApp;