const REDISKEY = require('../../../models/index').REDISKEY;
const ACCOUNTKEY = require('../../../models/index').ACCOUNTKEY;
const rankScore = require('../../../utils/rankScore');
const SUBTASK_TYPE = require('../src/consts').SUBTASK_TYPE;
const REWARD_TYPE = require('../src/consts').REWARD_TYPE;
const RANK_TRIM = require('../src/consts').RANK_TRIM;
const DateUtil = require('../../../utils/DateUtil');
const RANK_TYPE = require('../src/consts').RANK_TYPE;

function crossWeek() {
    let now = new Date();
    return now.getDay() == 1;
}


function crossMonth() {
    let now = new Date();
    return now.getDate() == 1;
}

module.exports = {
    hourReset: {
        enable: true,
        // time: '*/10,*,*,*,*,*',
        time: '0,0,*/1,*,*,*', //每小时第一分钟执行
        subTask: [
            { redisKey: REDISKEY.LOG.G_HOUR_DROP, type: SUBTASK_TYPE.DEL },
        ]
    },

    //按天重置
    dailyReset: {
        enable: true,
        // time: '*/10,*,*,*,*,*',
        time: '0,0,0,*,*,*', //每天0点执行
        subTask: [
            { redisKey: REDISKEY.PLATFORM_DATA.TODAY_PLATFORM_CASH, type: SUBTASK_TYPE.DEL }, //平台玩家每日兑现重置

            { redisKey: REDISKEY.FIRST_LOGIN, type: SUBTASK_TYPE.DEL },
            { redisKey: REDISKEY.DAY_REWARD, type: SUBTASK_TYPE.DEL },
            { redisKey: REDISKEY.VIP_DAILY_FILL, type: SUBTASK_TYPE.DEL },
            { redisKey: REDISKEY.BROKE_TIMES, type: SUBTASK_TYPE.DEL },
            { redisKey: REDISKEY.LEVEL_MISSION, type: SUBTASK_TYPE.DEL },
            { redisKey: REDISKEY.MISSION_DAILY_RESET, type: SUBTASK_TYPE.DEL },
            { redisKey: REDISKEY.HEARTBEAT, type: SUBTASK_TYPE.DEL },
            { redisKey: REDISKEY.HEARTBEAT_MIN_COST, type: SUBTASK_TYPE.DEL },
            { redisKey: REDISKEY.GOLD_SHOPPING, type: SUBTASK_TYPE.DEL },
            { redisKey: REDISKEY.DROP_RESET, type: SUBTASK_TYPE.DEL },
            { redisKey: REDISKEY.COMEBACK, type: SUBTASK_TYPE.DEL },
            { redisKey: REDISKEY.ACTIVE_DAILY_RESET, type: SUBTASK_TYPE.DEL },
            { redisKey: REDISKEY.ACTIVE_STAT_RESET, type: SUBTASK_TYPE.DEL },
            { redisKey: REDISKEY.FREE_DRAW, type: SUBTASK_TYPE.DEL },
            { redisKey: REDISKEY.TOTAL_DRAW, type: SUBTASK_TYPE.DEL },
            { redisKey: REDISKEY.GET_CARD, type: SUBTASK_TYPE.DEL },
            { redisKey: REDISKEY.GODDESS_CTIMES, type: SUBTASK_TYPE.DEL },
            { redisKey: REDISKEY.VIP_DAILY_REWARD, type: SUBTASK_TYPE.DEL },
            { redisKey: REDISKEY.SOCIAL_SHARE_STATUS_1, type: SUBTASK_TYPE.DEL },
            { redisKey: REDISKEY.SOCIAL_INVITE_DAILY_STATE, type: SUBTASK_TYPE.DEL },
            { redisKey: REDISKEY.SOCIAL_DAILY_INVITE_REWARD, type: SUBTASK_TYPE.DEL },
            { redisKey: REDISKEY.FREE_BOMB, type: SUBTASK_TYPE.DEL },
            { redisKey: REDISKEY.DAY_REWARD_ADV, type: SUBTASK_TYPE.DEL },
            { redisKey: REDISKEY.TOKEN, type: SUBTASK_TYPE.MODIFY, limit: 1000, value: 'daily_reset' },
            { redisKey: REDISKEY.GODDESS_FREE, type: SUBTASK_TYPE.SPECIAL, limit: 1000, value: 1 },//女神免费和cross任务合并
            // { redisKey: REDISKEY.GODDESS_CROSSOVER, type: SUBTASK_TYPE.SPECIAL, limit: 1000, value: 1 },
            //每日兑换数据
            { redisKey: REDISKEY.CIK_NUM, type: SUBTASK_TYPE.DEL },
            { redisKey: REDISKEY.CIK_LIMIT, type: SUBTASK_TYPE.DEL },
            { redisKey: REDISKEY.CIK_TIME, type: SUBTASK_TYPE.DEL },

            { redisKey: REDISKEY.LOG.G_DAY_DROP, type: SUBTASK_TYPE.DEL },
            { redisKey: REDISKEY.GODDESS_FREE_PAUSE_AWAY, type: SUBTASK_TYPE.DEL },
        ]
    },
    //按周重置
    weekReset: {
        enable: true,
        // time: '*/10,*,*,*,*,*',
        time: '0,0,0,*,*,7', //每周日0点执行
        subTask: [
            { redisKey: REDISKEY.SOCIAL_SHARE_STATUS_2, type: SUBTASK_TYPE.DEL },
            { redisKey: REDISKEY.RANK.BP, type: SUBTASK_TYPE.DEL },
            { redisKey: REDISKEY.RANK.FLOWER, type: SUBTASK_TYPE.DEL }
        ]
    },
    //按月重置
    monthReset: {
        enable: true,
        // time: '*/10,*,*,*,*,*',
        time: '0,0,0,1,*,*', //每月1号0点执行
        subTask: [
            {
                redisKey: REDISKEY.MONTH_SIGN, type: SUBTASK_TYPE.MODIFY, limit: 1000, value: function () {
                    var ret = "[";
                    var n = DateUtil.getDaysOfThisMonth();
                    for (var i = 0; i < n; i++) {
                        if (i > 0) ret += ",";
                        ret += "0";
                    }
                    ret += "]";
                    return ret;
                }
            },
            { redisKey: REDISKEY.MONTH_SIGN_EXTRA_REWARD, type: SUBTASK_TYPE.DEL },
        ]
    },
    //排行榜生成
    rankBuild: {
        enable: true,
        time: '*/20,*,*,*,*,*',
        subTask: [
            {
                redisKey: REDISKEY.RANK.GODDESS,
                originScore: null,
                range: 10000,
                limit: 1000,
                showDetail: 100,
                ext: [ACCOUNTKEY.NICKNAME, ACCOUNTKEY.FIGURE_URL, ACCOUNTKEY.SEX, ACCOUNTKEY.WEAPON_SKIN, ACCOUNTKEY.VIP, ACCOUNTKEY.CHARM_RANK, ACCOUNTKEY.CHARM_POINT]
            },
            {
                redisKey: REDISKEY.RANK.MATCH,
                originScore: null,
                range: 10000,
                limit: 1000,
                showDetail: 100,
                ext: [ACCOUNTKEY.NICKNAME, ACCOUNTKEY.FIGURE_URL, ACCOUNTKEY.SEX, ACCOUNTKEY.WEAPON_SKIN, ACCOUNTKEY.MATCH_RANK, ACCOUNTKEY.VIP, ACCOUNTKEY.CHARM_RANK]
            },
            {
                redisKey: REDISKEY.RANK.AQUARIUM,
                originScore: null,
                range: 10000,
                limit: 1000,
                showDetail: 100,
                ext: [ACCOUNTKEY.NICKNAME, ACCOUNTKEY.FIGURE_URL, ACCOUNTKEY.SEX, ACCOUNTKEY.WEAPON_SKIN, ACCOUNTKEY.VIP, ACCOUNTKEY.CHARM_RANK]
            },
            {
                redisKey: REDISKEY.RANK.CHARM,
                originScore: null,
                range: 10000,
                limit: 1000,
                showDetail: 100,
                ext: [ACCOUNTKEY.NICKNAME, ACCOUNTKEY.FIGURE_URL, ACCOUNTKEY.SEX, ACCOUNTKEY.WEAPON_SKIN, ACCOUNTKEY.VIP, ACCOUNTKEY.CHARM_RANK]
            },
            {
                redisKey: REDISKEY.RANK.BP,
                originScore: null,
                range: 10000,
                limit: 1000,
                showDetail: 100,
                ext: [ACCOUNTKEY.NICKNAME, ACCOUNTKEY.FIGURE_URL, ACCOUNTKEY.SEX, ACCOUNTKEY.WEAPON_SKIN, ACCOUNTKEY.VIP, ACCOUNTKEY.CHARM_RANK]
            },
            {
                redisKey: REDISKEY.RANK.FLOWER,
                originScore: null,
                range: 10000,
                limit: 1000,
                showDetail: 100,
                ext: [ACCOUNTKEY.NICKNAME, ACCOUNTKEY.FIGURE_URL, ACCOUNTKEY.SEX, ACCOUNTKEY.WEAPON_SKIN, ACCOUNTKEY.VIP, ACCOUNTKEY.CHARM_RANK]
            },
            {
                redisKey: REDISKEY.RANK.ARENA,
                originScore: null,
                range: 10000,
                limit: 1000,
                showDetail: 100,
                ext: [ACCOUNTKEY.NICKNAME, ACCOUNTKEY.FIGURE_URL, ACCOUNTKEY.SEX, ACCOUNTKEY.WEAPON_SKIN, ACCOUNTKEY.VIP,
                    ACCOUNTKEY.CHARM_RANK,ACCOUNTKEY.ARENA_WIN,ACCOUNTKEY.ARENA_FAIL]
            },
            // {
            //     redisKey: REDISKEY.RANK.GAIN,
            //     originScore: null,
            //     range: 10000,
            //     limit: 1000,
            //     showDetail: 100,
            //     ext: [ACCOUNTKEY.NICKNAME, ACCOUNTKEY.FIGURE_URL, ACCOUNTKEY.SEX]
            // },
            // {
            //     redisKey: REDISKEY.RANK.LOSS,
            //     originScore: null,
            //     range: 10000,
            //     limit: 1000,
            //     showDetail: 100,
            //     ext: [ACCOUNTKEY.NICKNAME, ACCOUNTKEY.FIGURE_URL, ACCOUNTKEY.SEX]
            // }
        ]
    },
    //排行奖励、重置
    rankReward: {
        enable: true,
        // time: '*,12,11,*,*,*',
        time: '0,0,0,*,*,*', //每天0点执行
        subTask: [
            {
                redisKey: REDISKEY.RANK.BP,
                reward: [REWARD_TYPE.DAILY, REWARD_TYPE.WEEK],
                awardType: RANK_TYPE.BP,
                limit: 500,
                reset: crossWeek,
                isResetReward:false,
                delete: [REDISKEY.BP],
            },
            {
                redisKey: REDISKEY.RANK.GODDESS,
                reward: [REWARD_TYPE.DAILY, REWARD_TYPE.WEEK],
                awardType: RANK_TYPE.GODDESS,
                limit: 500,
                reset: crossWeek,
                isResetReward:true,
                delete: [REDISKEY.MAX_WAVE]
            },
            {
                redisKey: REDISKEY.RANK.FLOWER,
                reward: [REWARD_TYPE.DAILY, REWARD_TYPE.WEEK],
                awardType: RANK_TYPE.FLOWER,
                limit: 500,
                reset: crossWeek,
                isResetReward:false,
                delete: [REDISKEY.FLOWER_RECEIVE_WEEKLY]
            },
            {
                redisKey: REDISKEY.RANK.AQUARIUM,
                reward: [REWARD_TYPE.DAILY],
                awardType: RANK_TYPE.PETFISH,
                limit: 500,
            },
            {
                redisKey: REDISKEY.RANK.CHARM,
                reward: [REWARD_TYPE.DAILY],
                awardType: RANK_TYPE.CHARM,
                limit: 500 ,
            },
            {
                redisKey: REDISKEY.RANK.MATCH,
                reward: [REWARD_TYPE.DAILY, REWARD_TYPE.MONTH],
                awardType: RANK_TYPE.MATCH,
                limit: 500,
                newPoints: function (points) {
                    return Math.floor(740 + Math.max(points - 800, 100) * 0.6);
                },
                condition: {
                    match_season_win: 10,
                    match_season_box: 10,
                    match_season_1st_win: 5
                },
                default_points: 800,
                default_rank: 5,
                reset: crossMonth,
                isResetReward:true,
            },
        ]
    },
    //排行榜剪切
    rankTrim: {
        enable: true,
        time: '*/20,*,*,*,*,*',
        subTask: [
            {
                redisKey: REDISKEY.RANK.BP,
                limit: 10000,
                position: RANK_TRIM.TOP
            },
            {
                redisKey: REDISKEY.RANK.GODDESS,
                limit: 10000,
                position: RANK_TRIM.TOP
            },
            {
                redisKey: REDISKEY.RANK.FLOWER,
                limit: 10000,
                position: RANK_TRIM.TOP
            },
            {
                redisKey: REDISKEY.RANK.AQUARIUM,
                limit: 10000,
                position: RANK_TRIM.TOP
            },
            {
                redisKey: REDISKEY.RANK.CHARM,
                limit: 10000,
                position: RANK_TRIM.TOP
            },
            {
                redisKey: REDISKEY.RANK.MATCH,
                limit: 10000,
                position: RANK_TRIM.TOP
            },
            // {
            //     redisKey: REDISKEY.RANK.GAIN,
            //     limit: 10000,
            //     position: RANK_TRIM.TOP
            // },
            // {
            //     redisKey: REDISKEY.RANK.LOSS,
            //     limit: 10000,
            //     position: RANK_TRIM.BOTTOM
            // }
        ]
    }
};