const Task = require('../../../utils/task/task');
const async = require('async');
const utils = require('../../../utils/utils');
const SUBTASK_TYPE = require('../src/consts').SUBTASK_TYPE;
const REDISKEY = require('../../../models/index').REDISKEY;
const RankReward =require('../src/rankReward');
const RankReset =require('../src/rankReset');
const MatchReward = require('../src/matchReward');
const MatchReset = require('../src/matchReset');
const GoddessReward = require('../src/goddessReward');

/**
 * 用户数据重置
 */
class RankRewardTask extends Task {
    constructor(conf) {
        super(conf);
        this._rankReward = new RankReward();
        this._rankReset = new RankReset();

        this._matchReward = new MatchReward();
        this._matchReset = new MatchReset();

        this._goddessReward = new GoddessReward();
    }


    async _handleMatch(task) {
        let month = task.reset && task.reset();
        await this._matchReward.handle(task, month);
        if(month){
            await this._matchReset.handle(task);
        }
    }

    async _handleGoddess(task) {
        let week = task.reset && task.reset();
        // logger.info("***************1******************");
        await this._goddessReward.handle(task, week);
        if(week){
            // logger.info("************2*********************");
            await this._rankReset.handle(task);
        }
    }

    async _handleRank(task){
        let week = task.reset && task.reset();
        await this._rankReward.handle(task, week);
        if(week){
            await this._rankReset.handle(task);
        }
    }


    //处理任务
    async _handleTask(task) {
        try {
            switch (task.redisKey) {
                case REDISKEY.RANK.MATCH: {
                    await this._handleMatch(task);
                    logger.info('排位赛奖励执行完成');
                }
                    break;
                case REDISKEY.RANK.GODDESS:
                    await this._handleGoddess(task);
                    break;
                case REDISKEY.RANK.CHARM:
                case REDISKEY.RANK.AQUARIUM:
                case REDISKEY.RANK.FLOWER:
                case REDISKEY.RANK.BP:
                    logger.info(`排行奖励${task.redisKey}开始执行`);
                    await this._handleRank(task);
                    logger.info(`排行奖励${task.redisKey}执行完成`);

                default:
                    break;
            }
        }catch (err){
            logger.error(`排行奖励任务${this.taskId}执行异常`, err);
        }
    }

    async _exeTask(cb) {
        logger.info('排行奖励开始执行');
        let tasks = this.taskConf.subTask;
        for (let i = 0; i < tasks.length; i++) {
            await this._handleTask(tasks[i]);
        }
        logger.info('排行奖励执行完成');
        utils.invokeCallback(cb, null);

    }
}

module.exports = RankRewardTask;