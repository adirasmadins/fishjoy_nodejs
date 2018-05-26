const RankReward = require('./rankReward');
const REDISKEY = require('../../../models/index').REDISKEY;
const redisAccountSync = require('../../../utils/redisAccountSync');

class GoddessReward extends RankReward {
    constructor() {
        super();
    }

    async handle(task, week) {
        // /* yxl */ logger.info('handle');
        await super.handle(task, week);
    }

    _getUids(rankInfo) {
        let uids = [];
        for (let uid in rankInfo.ranks) {
            uids.push(uid);
        }
        return uids;
    }

    async generateChart(rankInfo, week, task) {
        // /* yxl */ logger.info('2222222222222222222222222222rankInfo:', rankInfo);
        // /* yxl */ logger.info('GoddessReward.generateChart');
        let uids = this._getUids(rankInfo);
        if (uids.length == 0) {
            return;
        }

        let maxWaves = await redisAccountSync.oneCmdAsync(['hmget', `${REDISKEY.MAX_WAVE}`, uids]);

        /* yxl */ logger.info('maxWaves', maxWaves);
        logger.info('uids', uids);

        let cmds = [];
        for (let uid in rankInfo.ranks) {
            let award = this._getDailyAward(task.awardType, rankInfo.ranks[uid]);
            let ret = {
                award: award,
                rank: rankInfo.ranks[uid],
            };
            cmds.push(['hset', `${REDISKEY.RANK_DAILY_AWARD}:${task.redisKey}`, uid, JSON.stringify(ret)]);
            if (week && task.isResetReward) {
                let i = uids.indexOf(uid);
                award = this._getWeekAward(task.awardType, { rank: rankInfo.ranks[uid], wave: maxWaves[i] });
                let week_ret = {
                    award: award,
                    rank: rankInfo.ranks[uid],
                    score:maxWaves[i]
                };
                // logger.info("======================>",award);
                cmds.push(['hset', `${REDISKEY.RANK_WEEK_AWARD}:${task.redisKey}`, uid, JSON.stringify(week_ret)]);
            }
            // logger.info("===================>",cmds);
            if (cmds.length >= task.limit) {
                await redisAccountSync.multiAsync(cmds);
                cmds = [];
            }
        }
        await redisAccountSync.multiAsync(cmds);
    }
}

module.exports = GoddessReward;