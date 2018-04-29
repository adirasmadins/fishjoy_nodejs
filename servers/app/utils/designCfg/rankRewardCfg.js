const DESIGN_CFG = require('../imports').DESIGN_CFG;
const constDef = require('../../consts/constDef');
const rank_rankgame_cfg = DESIGN_CFG.rank_rankgame_cfg;
const designCfgName = require('./designCfgName');
const ERROR_OBJ = require('../../consts/fish_error').ERROR_OBJ;
const updateCfgsEvent = require('./updateCfgsEvent');

class RankRewardCfg {
    constructor() {
        this._cfgsMap = new Map();
        updateCfgsEvent.on(designCfgName.rank_ranklist_cfg, this._rankAward.bind(this));
        updateCfgsEvent.on(designCfgName.goddess_rankreward_cfg, this._rankWeekaward.bind(this));
        updateCfgsEvent.on(designCfgName.rank_rankgame_cfg, this._rankMonthaward.bind(this));
        this._rankAward(DESIGN_CFG.rank_ranklist_cfg);
        this._rankWeekaward(DESIGN_CFG.goddess_rankreward_cfg);
        this._rankMonthaward(DESIGN_CFG.rank_rankgame_cfg);
    }

    getAwardCfg(rankType) {
        if (!this._cfgsMap.has(rankType)) {
            logger.error(`排行类型${rankType} 对应配置文件不存在`);
            throw ERROR_OBJ.DESIGN_CFGS_NOT_EXIST;
        }
        return this._cfgsMap.get(rankType);
    }

    rankUtils() {
        return {
            getWeekAwardGoddess: this._getWeekAwardGoddess,
            getRankIdFromPoints: this._getRankIdFromPoints,
            getRankIdFromPointsAndRank: this._getRankIdFromPointsAndRank,
            getSeasonRewardFromRankgameCfg: this._getSeasonRewardFromRankgameCfg,
        };
    }

    _rankAward(cfgs) {
        cfgs.forEach(function (item) {
            let cfg = this._cfgsMap.get(item.type);
            if (!cfg) {
                cfg = [];
                this._cfgsMap.set(item.type, cfg);
            }
            cfg.push({
                interval: item.interval,    //--排名区间
                reward: item.reward,    //--奖励
            });
        }.bind(this));
    }

    _rankWeekaward(cfgs) {
        cfgs.forEach(function (item) {
            let cfg = this._cfgsMap.get(constDef.RANK_TYPE.GODDESS);
            if (!cfg) {
                cfg = [];
                this._cfgsMap.set(constDef.RANK_TYPE.GODDESS, cfg);
            }
            cfg.push({
                interval: item.interval,    //--排名区间
                reward: item.weekreward,    //--奖励
                limit: item.limit,    //--波数限制
            });
        }.bind(this));
    }

    _rankMonthaward(cfgs) {
        cfgs.forEach(function (item) {
            let cfg = this._cfgsMap.get(constDef.RANK_TYPE.MATCH);
            if (!cfg) {
                cfg = [];
                this._cfgsMap.set(constDef.RANK_TYPE.MATCH, cfg);
            }
            cfg.push({
                rank: item.id,    //--排名区间
                reward: item.seasonreward,    //--奖励
            });
        }.bind(this));
    }

    _getWeekAwardByMaxWave(rankreward_info, i, wave) {
        let goddessWeekAward = this.getAwardCfg(constDef.RANK_TYPE.GODDESS);
        var limit = rankreward_info.limit;
        if (wave < limit) {
            if (i >= goddessWeekAward.length - 1) {
                return [];
            }
            else {
                rankreward_info = goddessWeekAward[i + 1];
                return this._getWeekAwardByMaxWave(rankreward_info, i + 1, wave);
            }
        }
        return rankreward_info.reward;
    }

    _getWeekAwardGoddess(rank, wave) {
        let goddessWeekAward = this.getAwardCfg(constDef.RANK_TYPE.GODDESS);
        for (var i = 0; i < goddessWeekAward.length; i++) {
            var rankreward_info = goddessWeekAward[i];
            var interval = rankreward_info.interval;
            if (i > 0) {
                var rankreward_info_last = goddessWeekAward[i - 1];
                var interval_last = rankreward_info_last.interval;
                if (rank >= interval_last && rank <= interval) {
                    return this._getWeekAwardByMaxWave(rankreward_info, i, wave);
                }
            }
            else {
                if (rank <= interval) {
                    return this._getWeekAwardByMaxWave(rankreward_info, i, wave);
                }
            }
        }
        return [];
    }

    _getRankIdFromPoints(points) {
        for (let i = rank_rankgame_cfg.length - 1; i >= 0; i--) {
            let rank_info = rank_rankgame_cfg[i];
            if (points >= rank_info.integral) {
                return rank_info.id;
            }
        }
        return null;
    }

    /**
     * 从玩家的比赛积分和排名计算玩家的段位(只计算胜点在3600yishangzhe)
     */
    _getRankIdFromPointsAndRank(points, rank) {
        let count = rank_rankgame_cfg.length;
        let min_integral = rank_rankgame_cfg[count - 2].integral;
        // 胜点达不到判定指标直接返回false
        // 为什么不调用getRankIdFromPoints返回段位?
        // 一些场合需要立即停止判定，后面的玩家无需进入此逻辑.
        if (points < min_integral) {
            return 0;
        }
        if (points >= min_integral) {
            let rank_info_1 = rank_rankgame_cfg[count - 1];
            let rank_info_2 = rank_rankgame_cfg[count - 2];
            let rank_info_3 = rank_rankgame_cfg[count - 3];
            if (points >= rank_info_1.integral) {
                // 最强王者
                if (rank == 0) {
                    return rank_info_1.id;
                }
                // 十大高手
                else if (rank > 0 && rank <= 9) {
                    return rank_info_2.id;
                }
                // 钻石一段
                else {
                    return rank_info_3.id;
                }
            }
            else if (points >= rank_info_2.integral) {
                // 十大高手
                if (rank >= 0 && rank <= 9) {
                    return rank_info_2.id;
                }
                // 钻石一段
                else {
                    return rank_info_3.id;
                }
            }
        }
    }

    _getSeasonRewardFromRankgameCfg(rank_id) {
        for (let idx in rank_rankgame_cfg) {
            let rankgame_info = rank_rankgame_cfg[idx];
            if (rankgame_info.id == rank_id) {
                return rankgame_info.seasonreward;
            }
        }
        return null;
    }
}

module.exports = new RankRewardCfg();