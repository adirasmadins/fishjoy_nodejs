const Task = require('../../../utils/task/task');
const utils = require('../../../utils/utils');
const REDISKEY = require('../../../models/index').REDISKEY;
const redisAccountSync = require('../../../utils/redisAccountSync');
const mysqlAccountSync = require('../../../utils/mysqlAccountSync');
const rankRewardCfg = require('../../../utils/designCfg/rankRewardCfg');

/**
 * 用户数据重置
 */
class RankBuildTask extends Task {
    constructor(conf) {
        super(conf);
        this._tickBlackList = true;
    }

    _getRank(task, platform, skip, limit) {
        return new Promise(function (resolve, reject) {
            redisConnector.cmd.zrevrange(`${task.redisKey}:${platform}`, skip, limit, 'WITHSCORES', function (err, results) {
                if (err) {
                    logger.info('err:', err);
                    reject(err);
                    return;
                }
                resolve(results);
            });
        });
    }

    _getPlayerExInfoByMysql(task, player) {
        return new Promise(function (resolve, reject) {
            mysqlAccountSync.getAccount(player.uid, task.ext, function (err, account) {
                if (err || !account) {
                    resolve(player);
                    return;
                }
                player.ext = account;
                if (player.ext.match_rank) {
                    let rankId = rankRewardCfg._getRankIdFromPointsAndRank(player.score, account.match_rank);
                    if (0 == rankId) {
                        rankId = rankRewardCfg._getRankIdFromPoints(player.score);
                    }
                    player.ext.match_rank = rankId;
                }
                resolve();
            });
        });
    }

    async _getPlayerExInfoByRedis(task, player, i) {
        try {
            let account = await redisAccountSync.getAccountAsync(player.uid, task.ext);
            if (account) {
                player.ext = account.toJSON();
                if (player.ext.match_rank) {
                    let rankId = rankRewardCfg._getRankIdFromPointsAndRank(player.score, i);
                    if (0 == rankId) {
                        rankId = rankRewardCfg._getRankIdFromPoints(player.score);
                    }
                    player.ext.match_rank = rankId;
                }
                return null;
            }
        } catch (err) {
            logger.info(`${this.taskId}执行_getPlayerExInfoByRedis玩家数据异常uid:`, player.uid);
        }
        return player;
    }

    /**
     * 获取玩家详细信息
     * @param task
     * @param players
     * @returns {Promise}
     * @private
     */
    async _getPlayerExInfo(task, players) {
        let fromMysqlPlayers = [];
        for (let i = 0; i < players.length; i++) {
            let p = await this._getPlayerExInfoByRedis(task, players[i], i);
            if (p) {
                fromMysqlPlayers.push(p);
            }
        }

        if (0 == fromMysqlPlayers.length) {
            return;
        }

        for (let i = 0; i < fromMysqlPlayers.length; i++) {
            let p = await this._getPlayerExInfoByMysql(task, fromMysqlPlayers[i]);
            if (p) {
                logger.error(`${this.taskId}执行_getUserExInfo玩家数据异常uid:`, p.uid);
            }
        }
    }

    async _getRankInfo(task, platform) {
        let rankInfo = {
            players: [],
            ranks: {}
        };

        try {
            let rank100 = await this._getRank(task, platform, 0, task.showDetail - 1);

            for (let i = 0; i < rank100.length; i += 2) {
                rankInfo.players.push({
                    uid: rank100[i],
                    score: task.originScore ? task.originScore(rank100[i + 1]) : rank100[i + 1]
                });
                rankInfo.ranks[rank100[i]] = rankInfo.players.length;
            }

            await this._getPlayerExInfo(task, rankInfo.players);

            //获取排名100以后玩家名次
            let skip = 0;
            while (skip < task.range) {
                let ranks = await this._getRank(task, platform, skip, (skip + task.limit) - 1);
                if (0 == ranks.length) break;
                for (let i = 0; i < ranks.length && skip < task.range; i += 2) {
                    skip++;
                    rankInfo.ranks[ranks[i]] = skip;
                }
            }

        } catch (err) {
            logger.error(`${this.taskId}执行_getRankInfo异常`, err);
        }

        return rankInfo;
    }

    _saveRankInfo(task, platform, rankInfo) {
        let self = this;
        return new Promise(function (resolve, reject) {
            redisConnector.cmd.set(`${REDISKEY.getRankDataKey(task.redisKey)}:${platform}`, JSON.stringify(rankInfo), function (err, result) {
                if (err) {
                    logger.error(`${self.taskId}执行_saveRankInfo异常`, err);
                }
                resolve(result);
            });
        });
    }

    async _build(task) {
        for (let platform of Object.values(REDISKEY.PLATFORM_TYPE)) {
            let result = await this._getRankInfo(task, platform);
            await this._saveRankInfo(task, platform, result);
        }
    }

    async _getBlackList(){
        try {
            let blacklist = await redisConnector.smembers(REDISKEY.GLOBAL_DATA.BLACKLIST);
            if(!blacklist || blacklist.length == 0){
                return;
            }
            return blacklist;
        } catch (err) {
            err;
        }
    }

    async _kickBlackListRank(tasks) {

        let blacklist = await this._getBlackList();
        if(!blacklist){
            return;
        }

        for (let i = 0; i < tasks.length; i++) {
            try {
                for (let platform of Object.values(REDISKEY.PLATFORM_TYPE)) {
                    let rankKey = `${tasks[i].redisKey}:${platform}`;
                    let result = await redisConnector.zrem(rankKey, blacklist);
                    // logger.error('踢人结果', rankKey, result, blacklist);
                }
            } catch (err) {
                logger.error('踢人异常', err);
            }
        }

    }

    async _exeTask(cb) {
        logger.info('排行榜生成开始');
        let tasks = this.taskConf.subTask;
        await this._kickBlackListRank(tasks);

        for (let i = 0; i < tasks.length; i++) {
            await this._build(tasks[i]);
        }
        logger.info('排行榜生成完成');
        utils.invokeCallback(cb, null);

    }
}

//前一百名
//zrevrange rank_dev 0 100 withscores

//前一万名
//zrevrange rank_dev 100 10000 withscores

//返回有序集合中指定成员的排名，有序集成员按分数值递减(从大到小)排序
//ZREVRANK key member
module.exports = RankBuildTask;