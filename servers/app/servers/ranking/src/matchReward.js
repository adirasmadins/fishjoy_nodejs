const RankReward = require('./rankReward');
const REDISKEY = require('../../../models/index').REDISKEY;
const redisAccountSync = require('../../../utils/redisAccountSync');
const rankRewardCfg = require('../../../utils/designCfg/rankRewardCfg');

class MatchReward extends RankReward {
    constructor() {
        super();
    }

    /**
     * 获取排位赛季奖励
     * @param rank 名次
     * @param score 分数
     * @private
     */
    _getMonthAward(rank, score) {
        let rankId = rankRewardCfg._getRankIdFromPointsAndRank(score, rank - 1);
        if (0 == rankId) {
            rankId = rankRewardCfg._getRankIdFromPoints(score);
        }
        return rankRewardCfg._getSeasonRewardFromRankgameCfg(rankId);
    }

    async _getMatchInfo(uids) {
        let cmds = [];
        cmds.push(['HMGET', REDISKEY.MATCH_SEASON_WIN, uids]);
        cmds.push(['HMGET', REDISKEY.MATCH_SEASON_BOX, uids]);
        cmds.push(['HMGET', REDISKEY.MATCH_SEASON_1ST_WIN, uids]);

        return await redisAccountSync.multiAsync(cmds);
    }


    _requirement(condition, win, box, win_1st) {
        if (win >= condition.match_season_win && box >= condition.match_season_box && win_1st >= condition.match_season_1st_win) {
            return true;
        }

        return false;
    }


    async _giveAward(task, platform, month) {
        let rank = 0;
        let cmds = [];
        while (true) {
            let ranks = await redisAccountSync.getRankLimit(`${task.redisKey}:${platform}`, rank, (rank + task.limit) - 1);
            if (0 == ranks.length) {
                break;
            }
            // logger.info("=======================================",ranks);
            let uids = [];
            for (let i = 0; i < ranks.length; i += 2) {
                uids.push(ranks[i]);
            }

            let matchInfos = await this._getMatchInfo(uids);
            // logger.info(matchInfos);
            let match_season_win = matchInfos[0];
            let match_season_box = matchInfos[1];
            let match_season_1st_win = matchInfos[2];

            for (let i = 0; i < ranks.length; i += 2) {
                let uid = ranks[i];
                let score = ranks[i + 1];
                rank++;

                let award = this._getDailyAward(task.awardType, rank);
                let ret = {
                    award: award,
                    rank: rank
                };
                if (award) {
                    cmds.push(['HSET', `${REDISKEY.RANK_DAILY_AWARD}:${task.redisKey}`, uid, JSON.stringify(ret)]);
                }

                if (month && task.isResetReward) {
                    if (this._requirement(task.condition, match_season_win[i/2], match_season_box[i/2], match_season_1st_win[i/2])) {
                        let month_award = this._getMonthAward(rank, score);
                        let month_ret = {
                            award: month_award,
                            rank: rank,
                            score:score
                        };
                        if (month_award) {
                            cmds.push(['HSET', `${REDISKEY.RANK_MONTH_AWARD}:${task.redisKey}`, uid, JSON.stringify(month_ret)]);
                        }

                    }
                }

                if (cmds.length >= task.limit) {
                    await redisAccountSync.multiAsync(cmds);
                    cmds = [];
                }
            }
        }

        await redisAccountSync.multiAsync(cmds);
    }

    async handle(task, month) {
        for (let platform of Object.values(REDISKEY.PLATFORM_TYPE)) {
            await this._giveAward(task, platform, month);
        }
    }
}

module.exports = MatchReward;