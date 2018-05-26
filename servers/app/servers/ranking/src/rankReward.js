const REDISKEY = require('../../../models/index').REDISKEY;
const redisAccountSync = require('../../../utils/redisAccountSync');
const rankRewardCfg = require('../../../utils/designCfg/rankRewardCfg');
const consts = require('./consts');

class RankReward {
    constructor() {
    }

    /**
     * 获取周奖励
     * @param type
     * @param rank
     * @private
     */
    _getWeekAward(type, cond) {
        switch (type) {
            case consts.RANK_TYPE.GODDESS:
                return rankRewardCfg._getWeekAwardGoddess(cond.rank, cond.wave);
                break;
        }
    }

    /**
     * 获取每日奖励
     * @param type 排行类型
     * @param rank 排行名次
     * @private
     */
    _getDailyAward(type, rank) {
        let list = rankRewardCfg.getAwardCfg(type);
        for (let i = 0; i < list.length; ++i) {
            if (rank >= list[i].interval[0] && rank <= list[i].interval[1]) {
                return list[i].reward;
            }
        }
        return null;
    }

    /**
     * 处理奖励发放
     * @param task
     * @param week
     * @returns {Promise}
     */
    async handle(task, week) {
        for (let platform of Object.values(REDISKEY.PLATFORM_TYPE)) {
            try {
                let rankData = await redisAccountSync.oneCmdAsync(['get', `${REDISKEY.getRankDataKey(task.redisKey)}:${platform}`]);
                if (!rankData) {
                    continue;
                }
                let rankInfo = JSON.parse(rankData);
                await this.generateChart(rankInfo, week, task);
            } catch (err) {
                logger.error(`发放奖励${task.redisKey}执行异常`, err);
            }
        }
    }

    async generateChart(rankInfo, week, task) {
        let cmds = [];
        for (let uid in rankInfo.ranks) {
            let award = this._getDailyAward(task.awardType, rankInfo.ranks[uid]);
            let ret = {
                award: award,
                rank: rankInfo.ranks[uid]
            };
            cmds.push(['hset', `${REDISKEY.RANK_DAILY_AWARD}:${task.redisKey}`, uid, JSON.stringify(ret)]);
            if (week&&task.isResetReward) {
                award = this._getWeekAward(task.awardType, rankInfo.ranks[uid]);
                let week_ret = {
                    award: award,
                    rank: rankInfo.ranks[uid]
                };
                cmds.push(['hset', `${REDISKEY.RANK_WEEK_AWARD}:${task.redisKey}`, uid, JSON.stringify(week_ret)]);
            }
            if (cmds.length >= task.limit) {
                await redisAccountSync.multiAsync(cmds);
                cmds = [];
            }
        }
        await redisAccountSync.multiAsync(cmds);
    }

}

module.exports = RankReward;