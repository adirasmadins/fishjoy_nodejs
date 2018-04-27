const omelo = require('omelo');
const redisClient = require('../../utils/dbclients').redisClient;
const mysqlClient = require('../../utils/dbclients').mysqlClient;
const pumpwater = require('./pumpwater');
//TODO: const timeSyc = require('./timeSyc');

class EventSyncApp {
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

        pumpwater.start();
        // timeSyc.start();

        logger.info('数据同步服启动成功');
    }

    stop() {
        mysqlClient.stop();
        redisClient.stop();
        // timeSyc.stop();
        logger.info('数据同步服关闭');
    }
}

module.exports = new EventSyncApp();