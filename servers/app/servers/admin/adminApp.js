const omelo = require('omelo');
const {RedisConnector, MysqlConnector} = require('../../database/dbclient');
const taskPool = require('../../utils/task').taskPool;
const taskConf = require('./configs/task');
const OneMinute = require('./task/OneMinute');
const OnlineTenMinutes = require('./task/OnlineTenMinutes');
const OnlineOneHour = require('./task/OnlineOneHour');
const OneDay = require('./task/OneDay');
const redirect_https = require('../common/redirect_https');

//后台管理服务
// https://admin.szhlsg.com/index.html
class AdminApp {
    constructor() { 
        logger.error('-----------------AdminApp'); 
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
        logger.info('管理后台服务启动成功');
    }

    stop() {
        logger.info('管理后台服务已经停止');
    }

    _addTask() {
        let oneMinute = new OneMinute(taskConf.oneMinute);
        let onlineTenMinutes = new OnlineTenMinutes(taskConf.onlineTenMinutes);
        let onlineOneHour = new OnlineOneHour(taskConf.onlineOneHour);
        let oneDay = new OneDay(taskConf.oneDay);
        taskPool.addTask('oneMinute', oneMinute);
        taskPool.addTask('onlineTenMinutes', onlineTenMinutes);
        taskPool.addTask('onlineOneHour', onlineOneHour);
        taskPool.addTask('oneDay', oneDay);
    }
}

module.exports = AdminApp;