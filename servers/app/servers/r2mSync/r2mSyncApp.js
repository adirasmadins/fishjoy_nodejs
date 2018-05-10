const omelo = require('omelo');
const {RedisConnector, MysqlConnector} = require('../../database/dbclient');
const taskPool = require('../../utils/task').taskPool;
const AccountSync = require('./task/accountSync');
const AccountKick = require('./task/accountKick');
const task_conf = require('./config/task');

class R2mSyncApp {
    constructor(){
        this._instance = null;
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

        this._addTask();
        logger.info('REDIS数据同步服启动成功');
    }

    stop() {
        taskPool.removeTask();
        redisConnector.stop();
        mysqlConnector.stop();
        logger.info('REDIS数据同步服关闭');
    }

    _addTask() {
        let accountSync = new AccountSync(task_conf.userSync);
        let accountKick = new AccountKick(task_conf.userKick);
        taskPool.addTask('userSync', accountSync);
        taskPool.addTask('userKick', accountKick);
    }
}

module.exports = R2mSyncApp;