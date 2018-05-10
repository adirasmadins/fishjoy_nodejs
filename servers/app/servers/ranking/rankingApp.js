const omelo = require('omelo');
const {RedisConnector, MysqlConnector} = require('../../database/dbclient');
const taskPool = require('../../utils/task').taskPool;
const DailyResetTask = require('./task/dailyResetTask');
const MonthResetTask = require('./task/monthResetTask');
const WeekResetTask = require('./task/weekResetTask');
const RankBuildTask = require('./task/rankBuildTask');
const RankRewardTask = require('./task/rankRewardTask');
const RankTrimTask = require('./task/rankTrimTask');
const HourResetTask = require('./task/hourResetTask');
const task_conf = require('./config/task');


class RankingApp {
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
        logger.info('排行榜服启动成功');
    }

    stop() {
        taskPool.removeTask();
        redisConnector.stop();
        mysqlConnector.stop();
        logger.info('排行榜服关闭');
    }

    _addTask() {
        let dailyTask = new DailyResetTask(task_conf.dailyReset);
        let weekTask = new WeekResetTask(task_conf.weekReset);
        let monthTask = new MonthResetTask(task_conf.monthReset);
        let rankBuildTask = new RankBuildTask(task_conf.rankBuild);
        let rankRewardTask = new RankRewardTask(task_conf.rankReward);
        let rankTrimTask = new RankTrimTask(task_conf.rankTrim);
        let hourTask = new HourResetTask(task_conf.hourReset);
        taskPool.addTask('dailyTask', dailyTask);
        taskPool.addTask('weekTask', weekTask);
        taskPool.addTask('monthTask', monthTask);
        taskPool.addTask('rankBuild', rankBuildTask);
        taskPool.addTask('rankReward', rankRewardTask);
        taskPool.addTask('rankTrim', rankTrimTask);
        taskPool.addTask('hourTask', hourTask);
    }
}

module.exports = RankingApp;