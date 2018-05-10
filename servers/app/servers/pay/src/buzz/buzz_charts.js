const _ = require("underscore");
const ArrayUtil = require('../utils/ArrayUtil'),
    SORT_RULE = ArrayUtil.SORT_RULE;
const BuzzUtil = require('../utils/BuzzUtil');
const RedisUtil = require("../utils/RedisUtil");
const redisKeys = require('../../../../database').dbConsts.REDISKEY;
const RANK_TYPE = require('../rankCache/cacheConf').RANK_TYPE;
const CstError = require('../../../../consts/fish_error');
const ERROR_OBJ = CstError.ERROR_OBJ;
const cache = require('../rankCache/cache');
const buzz_reward = require('./buzz_reward');
const CacheAccount = require('./cache/CacheAccount');
const gameConfig = require('../../../../utils/imports').DESIGN_CFG;
const common_log_const_cfg  = gameConfig.common_log_const_cfg;
const tools = require('../../../../utils/tools');
const GameEventBroadcast = require('../../../../common/broadcast/GameEventBroadcast');

const TAG = "【buzz_charts】";

exports.updateRankFlower = updateRankFlower;
exports.getCharts = getCharts;
exports.getFriendsCharts = getFriendsCharts;
exports.getUserRank = getUserRank;
exports.getChartReward = getChartReward;


// 排行榜更新

function updateRankFlower(platform, uid, flowerCount) {
    RedisUtil.updateRank(redisKeys.RANK.FLOWER, platform, flowerCount, uid);
}

/**
 * 获取玩家历史排名(用于奖励发放, 分类为昨日，上周，上月)
 */
function getUserRank(dataObj, cb) {
    if (!lPrepare(dataObj)) return;
    BuzzUtil.cacheLinkDataApi(dataObj, "get_user_rank");

    _getUserRank(dataObj, cb);

    function lPrepare(input) {
        return BuzzUtil.checkParams(input, ['token', 'type'], "buzz_charts", cb);
    }
}

/**
 * 获取排行榜奖励(根据玩家ID从排行榜中获取名次并发给对应的奖励)
 */
function getChartReward(dataObj, cb) {
    if (!lPrepare(dataObj)) return;

    _getChartReward(dataObj, cb);

    function lPrepare(input) {
        return BuzzUtil.checkParams(input, ['token', 'type'], "buzz_charts", cb);
    }
}

/**
 * 客户端接口获取排行榜入口
 */
function getCharts(dataObj, cb) {
    const FUNC = TAG + "getCharts() --- ";
    //----------------------------------
    if (!lPrepare(dataObj)) return;
    BuzzUtil.cacheLinkDataApi(dataObj, "get_ranking");

    _getCharts(dataObj, cb);

    function lPrepare(input) {
        return BuzzUtil.checkParams(input, ['token', 'ranking_count',], "buzz_charts", cb);
    }
}

const getFriendsChartsFields = [
    "id",
    "nickname",
    "match_rank",
    "match_points",
    "vip",
    "weapon",
    "weapon_skin",
    "figure_url",
    "charm_rank",
];

/**
 * buzz_social调用接口
 */
async function getFriendsCharts(list, cb) {
    const FUNC = TAG + "getFriendsCharts() --- ";
    let accounts = await CacheAccount.getAccountsFieldsByIdsSync(list, getFriendsChartsFields);
    ArrayUtil.sort(accounts, "match_points", SORT_RULE.DESC, "vip", SORT_RULE.DESC);
    cb && cb(null, accounts);
}

function _getUserRank(dataObj, cb) {
    let type = dataObj.type;
    let account = dataObj.account;
    let obj_key = _getRewardKey(type);
    buzz_reward.getRewardInfo(account, obj_key, function (err, res) {
        if (err) {
            cb(err);
            return;
        }
        let ret = {
            my_rank: 10001,
            reward: 0
        };
        if (res) {
            if (res.rank) {
                ret.my_rank = res.rank;
            }
            if (res.award && res.award.length > 0) {
                ret.reward = 1;
            }
            if (res.score) {
                ret.score = res.score;
            }
        }
        cb(null, ret);
    });
}

function _getChartReward(dataObj, cb) {
    let type = dataObj.type;
    let account = dataObj.account;
    _resetReward(type, account, cb);
}

function _resetReward(type, account, cb) {
    let obj_key = _getRewardKey(type);
    let uid = account.id;
    redisConnector.cmd.hget(obj_key, uid, function (err, reward) {
        if (err) {
            cb && cb(err);
            return;
        }
        if (reward) {
            reward = JSON.parse(reward);
        }
        if (reward && reward.award) {
            let item_list = tools.BuzzUtil.getItemList(reward.award);
            BuzzUtil.putIntoPack(account, item_list, function (reward_info) {
                let change = BuzzUtil.getChange(account, reward_info);
                let ret = {
                    item_list: item_list,
                    change: change,
                    my_rank: reward.rank || 10001,
                    reward: 0,
                };
                let value = {
                    rank: reward.rank || 10001
                };
                if (reward.score) {
                    value.score = reward.score;
                }
                RedisUtil.hset(obj_key, uid, JSON.stringify(value), function (err, res) {
                    if (err) {
                        cb(err);
                        return;
                    }
                    cb(null, ret);
                });
                _addBroadcast(account, type, reward);
                logBuilder.addGoldAndItemLog(item_list, account, common_log_const_cfg.CHARTS_REWARD);
            });
        }
        else {
            cb();
        }
    });
}

function _addBroadcast(account, type, reward) {
    if (_isDailyReward(type) && 1 == reward.rank) {
        _didAddBroadcast(account, GameEventBroadcast.TYPE.GAME_EVENT.RANK_FIRST);
    }
    else if (_isWeekReward(type) && 30 >= reward.rank) {
        _didAddBroadcast(account, GameEventBroadcast.TYPE.GAME_EVENT.GODDESS_REWARD);
    }
    else if (_isMonthReward(type)) {
        let rankid = tools.CfgUtil.rankgame.getRankIdFromPoints(reward.score);
        if (rankid > 11) {
            _didAddBroadcast(account, GameEventBroadcast.TYPE.GAME_EVENT.SEASON_REWARD, {rankid:rankid});
        }
    }
}

function _didAddBroadcast(account, type, extra) {
    let params = [account.nickname];
    if (type == GameEventBroadcast.TYPE.GAME_EVENT.SEASON_REWARD) {
        let rankName = tools.CfgUtil.rankgame.getRankNameFromId(extra.rankid);
        params.push(rankName);
    }
    let content = {
        type: type,
        params: params,
    };
    new GameEventBroadcast(content).extra(account).add();
}

function _getCharts(dataObj, cb) {
    const FUNC = TAG + "_getCharts() --- uid:" + dataObj.account_id;
    const EFUNC = TAG + "_getCharts() --- uid:" + dataObj.account_id;
    logger.info(FUNC + "CALL...");

    let token = dataObj.token;
    let ranking_count = dataObj.ranking_count;
    let offset = dataObj.offset || 0;
    let type = dataObj.type || RANK_TYPE.ALL;

    let start = offset;
    let stop = offset + ranking_count;

    doNextWithAccount(dataObj.account);
    function doNextWithAccount(account) {
        if (ranking_count > 100) {
            logger.error(EFUNC + "请求的排名数超过了限制: 最大排名:100, 请求参数:" + ranking_count);
            cb(ERROR_OBJ.RANK_COUNT_TOO_LARGE);
            return;
        }

        let platform = account.platform;

        let chart_goddess = null;
        let chart_match = null;
        let chart_aquarium = null;
        let chart_charm = null;
        let chart_bp = null;
        let chart_flower = null;

        logger.info(FUNC + "type:", type);

        if (RANK_TYPE.ALL == type || RANK_TYPE.GODDESS == type) {
            let chart = cache.getChart(platform, RANK_TYPE.GODDESS, start, stop);
            let my_rank = cache.getRank(platform, RANK_TYPE.GODDESS, account.id);
            my_rank['score'] = account.max_wave;
            chart_goddess = { "rank": chart, "my_rank": my_rank };
        }
        if (RANK_TYPE.ALL == type || RANK_TYPE.RANKING == type) {
            let chart = cache.getChart(platform, RANK_TYPE.MATCH, start, stop);
            let my_rank = cache.getRank(platform, RANK_TYPE.MATCH, account.id);
            my_rank['score'] = account.match_rank;
            chart_match = { "rank": chart, "my_rank": my_rank };
        }
        if (RANK_TYPE.ALL == type || RANK_TYPE.PETFISH == type) {
            let chart = cache.getChart(platform, RANK_TYPE.AQUARIUM, start, stop);
            let my_rank = cache.getRank(platform, RANK_TYPE.AQUARIUM, account.id);
            my_rank['score'] = account.petfish_total_level;
            chart_aquarium = { "rank": chart, "my_rank": my_rank };
        }
        if (RANK_TYPE.ALL == type || RANK_TYPE.CHARM == type) {
            let chart = cache.getChart(platform, RANK_TYPE.CHARM, start, stop);
            let my_rank = cache.getRank(platform, RANK_TYPE.CHARM, account.id);
            my_rank['score'] = account.charm_point;
            chart_charm = { "rank": chart, "my_rank": my_rank };
        }
        if (RANK_TYPE.ALL == type || RANK_TYPE.BP == type) {
            let chart = cache.getChart(platform, RANK_TYPE.BP, start, stop);
            let my_rank = cache.getRank(platform, RANK_TYPE.BP, account.id);
            my_rank['score'] = account.bp;
            chart_bp = { "rank": chart, "my_rank": my_rank };
        }
        if (RANK_TYPE.ALL == type || RANK_TYPE.FLOWER == type) {
            let chart = cache.getChart(platform, RANK_TYPE.FLOWER, start, stop);
            let my_rank = cache.getRank(platform, RANK_TYPE.FLOWER, account.id);
            my_rank['score'] = account.flower_receive_weekly;
            chart_flower = { "rank": chart, "my_rank": my_rank };
        }
        let ret = {
            "rankgame": chart_match,
            "goddess": chart_goddess,
            "aquarium": chart_aquarium,
            "charm": chart_charm,
            "integral": chart_bp,
            "flower": chart_flower,
        };
        logger.info(FUNC + "ret:", ret);
        cb(null, ret);
    }
}

/**
 * 返回当前客户端支持的格式
 */
function formatChart(chart, field, offset) {
    for (let i = 0; i < chart.length; i++) {
        let account = chart[i];
        account.id = account.uid;
        if (account.match_rank) {
            account.rank = account.match_rank;
        }
        account[field] = account.score;
    }
}

function _getRewardKey(type) {
    let redis_key = null;
    // 每日奖励
    if (_isDailyReward(type)) {
        type = type % 100;
        switch (type) {
            case RANK_TYPE.CHARM:
                redis_key = redisKeys.CHART.RANK_DAILY_AWARD + ":" + redisKeys.RANK.CHARM;
                break;
            case RANK_TYPE.FLOWER:
                redis_key = redisKeys.CHART.RANK_DAILY_AWARD + ":" + redisKeys.RANK.FLOWER;
                break;
            case RANK_TYPE.BP:
                redis_key = redisKeys.CHART.RANK_DAILY_AWARD + ":" + redisKeys.RANK.BP;
                break;
            case RANK_TYPE.AQUARIUM:
                redis_key = redisKeys.CHART.RANK_DAILY_AWARD + ":" + redisKeys.RANK.AQUARIUM;
                break;
            case RANK_TYPE.GODDESS:
                redis_key = redisKeys.CHART.RANK_DAILY_AWARD + ":" + redisKeys.RANK.GODDESS;
                break;
            case RANK_TYPE.MATCH:
                redis_key = redisKeys.CHART.RANK_DAILY_AWARD + ":" + redisKeys.RANK.MATCH;
                break;
        }

    }
    // 每周奖励
    else if (_isWeekReward(type)) {
        redis_key = redisKeys.CHART.RANK_WEEK_AWARD + ":" + redisKeys.RANK.GODDESS;
    }
    // 每月奖励
    else if (_isMonthReward(type)) {
        redis_key = redisKeys.CHART.RANK_MONTH_AWARD + ":" + redisKeys.RANK.MATCH;
    }
    return redis_key;
}

function _isDailyReward(type) {
    return type > 100 && type < 1000;
}

function _isWeekReward(type) {
    return type > 1000 && type < 10000;
}

function _isMonthReward(type) {
    return type > 10000;
}