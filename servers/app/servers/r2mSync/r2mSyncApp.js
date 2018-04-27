const omelo = require('omelo');
const redisClient = require('../../utils/dbclients').redisClient;
const mysqlClient = require('../../utils/dbclients').mysqlClient;
const taskPool = require('../../utils/task').taskPool;
const AccountSync = require('./task/accountSync');
const AccountKick = require('./task/accountKick');
const task_conf = require('./config/task');

class R2mSyncApp {
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

        this._addTask();
        logger.info('REDIS数据同步服启动成功');
    }

    stop() {
        taskPool.removeTask();
        redisClient.stop();
        mysqlClient.stop();
        logger.info('REDIS数据同步服关闭');
    }

    _addTask() {
        let accountSync = new AccountSync(task_conf.userSync);
        let accountKick = new AccountKick(task_conf.userKick);
        taskPool.addTask('userSync', accountSync);
        taskPool.addTask('userKick', accountKick);
    }
}

module.exports = new R2mSyncApp();