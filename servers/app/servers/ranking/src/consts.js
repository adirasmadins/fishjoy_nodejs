const DESIGN_CFG = require('../../../utils/imports').DESIGN_CFG;
const rank_ranklist_cfg = DESIGN_CFG.rank_ranklist_cfg;
const rank_rankgame_cfg = DESIGN_CFG.rank_rankgame_cfg;
const goddess_rankreward_cfg = DESIGN_CFG.goddess_rankreward_cfg;

const RANK_TYPE = {
    MATCH: 3,   //排位赛排行榜
    GODDESS: 4,  //保卫女神排行榜
    PETFISH: 5, //宠物鱼
    CHARM: 6,  //魅力值排行榜
    BP: 7,    //捕鱼积分排行榜(渔王争霸)
    FLOWER: 8,  //鲜花排行榜
};


let rank_award_config = {};
rank_ranklist_cfg.forEach(function (item) {
    if (!rank_award_config[item.type]) {
        rank_award_config[item.type] = [];
    }
    rank_award_config[item.type].push({
        interval: item.interval,    //--排名区间
        reward: item.reward,    //--奖励
    });

});

//----------------------------------------------------------------------

let rank_weekaward_config = {};
goddess_rankreward_cfg.forEach(function (item) {
    if (!rank_weekaward_config[RANK_TYPE.GODDESS]) {
        rank_weekaward_config[RANK_TYPE.GODDESS] = [];
    }
    rank_weekaward_config[RANK_TYPE.GODDESS].push({
        interval: item.interval,    //--排名区间
        reward: item.weekreward,    //--奖励
        limit: item.limit,    //--波数限制
    });
});

let rank_monthaward_config = {};
rank_rankgame_cfg.forEach(function (item) {
    if (!rank_monthaward_config[RANK_TYPE.MATCH]) {
        rank_monthaward_config[RANK_TYPE.MATCH] = [];
    }
    rank_monthaward_config[RANK_TYPE.MATCH].push({
        rank: item.id,    //--排名区间
        reward: item.seasonreward,    //--奖励
    });
});

//----------------------------------------------------------------------


function getWeekAwardGoddess(rank, wave) {
    let goddessWeekAward = rank_weekaward_config[RANK_TYPE.GODDESS];
    // logger.info("goddessWeekAward: ",goddessWeekAward);
    // logger.info("rank: ",rank,wave);
    for (var i = 0; i < goddessWeekAward.length; i++) {
        var rankreward_info = goddessWeekAward[i];
        var interval = rankreward_info.interval;
        if (i > 0) {
            var rankreward_info_last = goddessWeekAward[i - 1];
            var interval_last = rankreward_info_last.interval;
            if (rank >= interval_last && rank <= interval) {
                return getWeekAwardByMaxWave(rankreward_info, i, wave);
            }
        }
        else {
            if (rank <= interval) {
                return getWeekAwardByMaxWave(rankreward_info, i, wave);
            }
        }
    }
    return [];

    function getWeekAwardByMaxWave(rankreward_info, i, wave) {
        var limit = rankreward_info.limit;
        if (wave < limit) {
            if (i >= goddessWeekAward.length - 1) {
                return [];
            }
            else {
                rankreward_info = goddessWeekAward[i + 1];
                return getWeekAwardByMaxWave(rankreward_info, i + 1, wave);
            }
        }
        return rankreward_info.reward;
    }
}

function getRankIdFromPoints(points) {
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
function getRankIdFromPointsAndRank(points, rank) {
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

function getSeasonRewardFromRankgameCfg(rank_id) {
    for (let idx in rank_rankgame_cfg) {
        let rankgame_info = rank_rankgame_cfg[idx];
        if (rankgame_info.id == rank_id) {
            return rankgame_info.seasonreward;
        }
    }
    return null;
}

module.exports = {
    getWeekAwardGoddess: getWeekAwardGoddess,
    getRankIdFromPoints:getRankIdFromPoints,
    getSeasonRewardFromRankgameCfg:getSeasonRewardFromRankgameCfg,
    getRankIdFromPointsAndRank:getRankIdFromPointsAndRank,
    //子任务类型定义
    SUBTASK_TYPE: {
        REWARD: Symbol('reward'),
        DEL: Symbol('del'),
        MODIFY: Symbol('modify'),
        SPECIAL:Symbol('special')
    },

    RANK_TYPE: {
        MATCH: 3,   //排位赛排行榜
        GODDESS: 4,  //保卫女神排行榜
        PETFISH: 5, //宠物鱼
        CHARM: 6,  //魅力值排行榜
        BP: 7,    //捕鱼积分排行榜(渔王争霸)
        FLOWER: 8,  //鲜花排行榜
    },

    REWARD_TYPE: {
        DAILY: 1,
        WEEK: 2,
        MONTH: 3
    },

    RANK_TRIM:{
        TOP:1,
        BOTTOM:2,
    },

    RANK_DAILY_AWARD_CONFIG: rank_award_config,
    RANK_WEEK_AWARD_CONFIG: rank_weekaward_config,
    RANK_MONTH_AWARD_CONFIG: rank_monthaward_config,
};



