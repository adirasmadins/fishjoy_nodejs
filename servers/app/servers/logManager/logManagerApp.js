const omelo = require('omelo');
const mysqlClient = require('../../utils/dbclients').mysqlClient;
const taskPool = require('../../utils/task').taskPool;
const LogBackup = require('./task/logBackup');
const LogRemove = require('./task/logRemove');
const taskConf = require('./config/task');

/**
 * 日志管理服务
 * 负责备份、转移、清理
 */
class LogManagerApp {
    constructor(){
        this._instance = null;
    }
    async start() {
        let result = await mysqlClient.start(omelo.app.get('mysql'));
        if (!result) {
            process.exit(0);
            return;
        }

        this._addTask();
        logger.info('REDIS数据同步服启动成功');
    }

    stop() {
        taskPool.removeTask();
        mysqlClient.stop();
        logger.info('REDIS数据同步服关闭');
    }

    _addTask() {
        let logBackup = new LogBackup(taskConf.logBackup);
        let logRemove = new LogRemove(taskConf.logRemove);
        taskPool.addTask('logBackup', logBackup);
        taskPool.addTask('logRemove', logRemove);
    }
}

module.exports = new LogManagerApp();