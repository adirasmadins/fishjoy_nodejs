const omelo = require('omelo');
const MysqlConnector = require('../../database/dbclient').MysqlConnector;
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
        this._mysqlConnector = new MysqlConnector();
        let result = await this._mysqlConnector.start(omelo.app.get('mysql'));
        if (!result) {
            process.exit(0);
            return;
        }

        this._addTask();
        logger.info('REDIS数据同步服启动成功');
    }

    stop() {
        taskPool.removeTask();
        mysqlConnector.stop();
        logger.info('REDIS数据同步服关闭');
    }

    _addTask() {
        let logBackup = new LogBackup(taskConf.logBackup);
        let logRemove = new LogRemove(taskConf.logRemove);
        taskPool.addTask('logBackup', logBackup);
        taskPool.addTask('logRemove', logRemove);
    }
}

module.exports = LogManagerApp;