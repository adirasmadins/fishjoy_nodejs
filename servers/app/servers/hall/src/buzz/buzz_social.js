const BuzzUtil = require('../utils/BuzzUtil');
const moment = require('moment');
const CacheAccount = require('./cache/CacheAccount');
const CommonUtil = require('./CommonUtil');
const RedisUtil = require('../utils/RedisUtil');
const buzz_charts = require('./buzz_charts');
const redisKeys = require('../../../../database').dbConsts.REDISKEY;
const dao_social = require('../dao/dao_social');
const ERROR_OBJ = require('../../../../consts/fish_error').ERROR_OBJ;
const _ = require("underscore");
const versionsUtil = require('../../../../utils/imports').versionsUtil;

const TAG = "【buzz_social】";

// 加入的类型
const JOIN_TYPE = {
    /** 邀请注册 */
    INVITE: 100,
    /** 分享 */
    SHARE: 101,
    /** 收藏 */
    ENSHRINE: 102,
    /** 自己来的 */
    SELF: 103,
    /** 邀请进入游戏 */
    INVITE_DAILY: 104,
    /** 首次抽奖分享*/
    FIST_SHARE: 105
};
exports.JOIN_TYPE = JOIN_TYPE;

// 社交领奖的类型
const SOCIAL_REWARD_TYPE = {
    /** 邀请领奖 */
    INVITE: 100,
    /** 分享领奖 */
    SHARE: 101,
    /** 收藏领奖 */
    ENSHRINE: 102,
    /** 每日邀请领奖 */
    INVITE_DAILY: 104,
    /** 首次抽奖分享领奖 */
    FIST_SHARE: 105
};
exports.SOCIAL_REWARD_TYPE = SOCIAL_REWARD_TYPE;

// 分享的状态
const SHARE_STATUS = {
    /** 待分享 */
    SHARE: 0,
    /** 未领取 */
    REWARD: 1,
    /** 已领取 */
    GOTTEN: 2,
};
exports.SHARE_STATUS = SHARE_STATUS;

// 收藏的状态
const ENSHRINE_STATUS = {
    /** 待收藏 */
    TOBE_ENSHRINE: 0,
    /** 未领取 */
    REWARD: 1,
    /** 已领取 */
    GOTTEN: 2,
};
exports.ENSHRINE_STATUS = ENSHRINE_STATUS;

// 分享的重复类型
const REPEAT_TYPE = {
    /** 不重置 */
    NONE: 0,
    /** 每日重置 */
    DAILY: 1,
    /** 每周重置 */
    WEEKLY: 2,
};
exports.REPEAT_TYPE = REPEAT_TYPE;

//==============================================================================
// public
//==============================================================================

//------------------------------------------------------------------------------
// definition
//------------------------------------------------------------------------------
exports.getInviteProgress = getInviteProgress;
exports.getShareStatus = getShareStatus;
exports.getEnshrineStatus = getEnshrineStatus;
exports.inviteSuccess = inviteSuccess;
exports.shareSuccess = shareSuccess;
exports.enshrineSuccess = enshrineSuccess;
exports.getSocialReward = getSocialReward;
exports.getFriendsCharts = _getFriendsCharts;
exports.inviteDaily = inviteDaily;
exports.getFreeCard = getFreeCard;
exports.getFreeBomb = getFreeBomb;

//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------



/**
 * 获取好友邀请进度.
 */
function getInviteProgress(dataObj, cb) {
    if (!lPrepare(dataObj)) return;

    dao_social.getInviteProgress(dataObj, cb);

    function lPrepare(input) {
        return _checkParams(input, ['token'], "buzz_social", cb);
    }
}

/**
 * 获取好友分享状态.
 */
function getShareStatus(dataObj, cb) {
    if (!lPrepare(dataObj)) return;

    dao_social.getShareStatus(dataObj, cb);

    function lPrepare(input) {
        return _checkParams(input, ['token'], "buzz_social", cb);
    }
}

/**
 * 获取收藏状态.
 */
function getEnshrineStatus(dataObj, cb) {
    let account = dataObj.account;
    cb(null, { enshrine_status: account.social_enshrine_status });
}

/**
 * 接收邀请好友进度记录.
 */
function inviteSuccess(dataObj, cb) {
    if (!lPrepare(dataObj)) return;

    dao_social.inviteSuccess(dataObj, cb);

    function lPrepare(input) {
        // type = 100(邀请新用户) | 101(分享) | 104（进入游戏）
        let commonCheck = _checkParams(input, ['token', 'type'], "buzz_social", cb);
        if (dataObj.type != JOIN_TYPE.SELF) {
            commonCheck = commonCheck || _checkParams(input, ['fuid'], "buzz_social", cb);
        }
        return commonCheck;
    }
}

/**
 * 记录每日邀请好友
 */
function inviteDaily(req, dataObj, cb) {
    const FUNC = TAG + "inviteDaily() --- ";
    if (!lPrepare(dataObj)) return;

    let token = dataObj["token"];
    let fuid = dataObj["fuid"];
    let uid = token.split("_")[0];
    if (!fuid) {
        cb && cb(ERROR_OBJ.INVITE_NULL_FRIEND);
        return;
    }
    CacheAccount.getAccountById(fuid, function (err, account) {
        let socialDailyInvite = account.social_daily_invite_reward;
        if (socialDailyInvite.indexOf(uid) === -1) {
            socialDailyInvite.push(uid);
            account.social_daily_invite_reward = socialDailyInvite;
            account.commit();
        }
        cb();
    });

    function lPrepare(input) {
        return _checkParams(input, ['token'], "buzz_social", cb);
    }
}

/**
 * 接收邀请好友进度记录.
 */
function shareSuccess(dataObj, cb) {
    if (!lPrepare(dataObj)) return;

    dao_social.shareSuccess(dataObj);
    cb(null, { is_ok: 1 });

    function lPrepare(input) {
        // type = 100(邀请) | 101(分享)
        return _checkParams(input, ['share_id'], "buzz_social", cb);
    }
}

/**
 * 收藏成功.
 */
function enshrineSuccess(dataObj, cb) {
    let account = dataObj.account;
    let status = dataObj.status;
    if (account.social_enshrine_status > status) {
        logger.error("enshrineSuccess err,原状态:" + account.social_enshrine_status + ", 想设置的状态:" + status);
        return;
    }
    account.social_enshrine_status = status;
    account.commit();
    cb(null, { is_ok: 1 });
}

/**
 * 社交奖励领取.
 */
function getSocialReward(dataObj, cb) {
    if (!lPrepare(dataObj)) return;

    dao_social.getSocialReward(dataObj, cb);

    function lPrepare(input) {
        let commonCheck = _checkParams(input, ['token', 'type'], "buzz_social", cb);
        if (dataObj.type == JOIN_TYPE.SHARE) {
            commonCheck = commonCheck || _checkParams(input, ['share_id'], "buzz_social", cb);
        }
        return commonCheck;
    }
}

/**
 * 获取好友的排行榜.
 */
function _getFriendsCharts(data, cb) {
    let account = data.account;
    let fopenids = data['fopenids'];
    if (typeof fopenids === 'string') {
        try {
            fopenids = JSON.parse(fopenids);
        } catch (err) {
            logger.error("_getFriendsCharts json转换异常:", fopenids);
            cb && cb(ERROR_OBJ.WRONG_JSON_FORMAT);
            return;
        }
    }
    let platform = account.platform;
    let uid = account.id;
    let fopenidsMap = {};
    if(fopenids && fopenids.length > 0){
        for (let i = 0; i < fopenids.length; i++) {
            fopenids[i] = versionsUtil.getOpenid(fopenids[i], platform);
            fopenidsMap[fopenids[i]] = 1;
        }
    }

    // 获取PAIR.OPENID_UID中所有玩家的uid.
    RedisUtil.hmget(redisKeys.MAP_OPENID_UID, fopenids, function (err, uid_list) {
        if (err) return cb && cb(err);

        let list = [];
        list.push(uid);
        for (let i = 0; i < uid_list.length; i++) {
            let items = uid_list[i];
            items && list.indexOf(Number(items)) === -1 && list.push(Number(items));
        }

        let gameFriend = account.game_friend;
        for (let i = 0; i < gameFriend.length; i++) {
            let items = +gameFriend[i];
            list.indexOf(items) === -1 && list.push(items);
        }

        let channel_game_friend = account.channel_game_friend;
        for (let i = 0; i < channel_game_friend.length; i++) {
            let items = +channel_game_friend[i];
            list.indexOf(items) === -1 && list.push(items);
            fopenidsMap[channel_game_friend[i]] = 1;
        }

        buzz_charts.getFriendsCharts(list, fopenidsMap, data.offset, data.ranking_count, function (err, charts) {
            if (err) return cb && cb(err);

            let channel_friend_count = _.keys(fopenidsMap).length;
            let ret = {
                rank_change: 0,
                notify_friends: [],
                rank_list: charts,
                charm_point: account.charm_point,
                charm_rank: account.charm_rank,
                channel_friend_count:channel_friend_count,
                game_friend_count:gameFriend.length
            };

            cb && cb(null, ret);
        });
    });
}


function _checkParams(input, params, hint, cb) {
    for (let i = 0; i < params.length; i++) {
        let param_name = params[i];
        let param = input[params[i]];
        if (!CommonUtil.isParamExist(hint, param, "接口调用请传参数" + param_name, cb)) return false;
    }
    return true;
}

function getFreeCard(data, cb) {
    if (!lPrepare(data)) return;
    let type = data['type'];
    let account = data.account;
    let shop_card = BuzzUtil.getShopCardById(type);
    if (null === shop_card) {
        cb(ERROR_OBJ.BUY_WRONG_SHOP_ID);
        return;
    }
    let card = account.card;
    let start_date = moment(new Date()).format('YYYY-MM-DD');
    if (type === 100) {
        if (card.normal && _isCardValid(card.normal.start_date, 30)) {
            cb && cb(ERROR_OBJ.MONTH_CARD_NORMAL_ALREADY);
            return;
        }
        if (account.social_invite_month.length < shop_card.sharecount) {
            cb && cb(ERROR_OBJ.INVITE_NOT_ENOUGH);
            return;
        }
        card.normal = { start_date: start_date };
    } else if (type === 101) {
        if (card.senior && _isCardValid(card.senior.start_date, 30)) {
            cb && cb(ERROR_OBJ.MONTH_CARD_SENIOR_ALREADY);
            return;
        }
        if (account.social_invite_month.length < shop_card.sharecount) {
            cb && cb(ERROR_OBJ.INVITE_NOT_ENOUGH);
            return;
        }
        card.senior = { start_date: start_date };
    } else if (type === 102) {
        if (card.week && _isCardValid(card.week.start_date, 7)) {
            cb && cb(ERROR_OBJ.WEEK_CARD_ALREADY);
            return;
        }
        if (account.social_invite_week.length < shop_card.sharecount) {
            cb && cb(ERROR_OBJ.INVITE_NOT_ENOUGH);
            return;
        }
        card.week = { start_date: start_date };
    }
    CacheAccount.setCard(account, card);

    let ret = {
        card: account.card,
        get_card: account.get_card,
        change: {
            charm_rank: account.charm_rank,
            charm_point: account.charm_point
        }
    };
    cb(null, ret);

    function lPrepare(input) {
        return _checkParams(input, ['token'], "buzz_social", cb);
    }
}

function _isCardValid(buyDate, time) {
    if (buyDate) {
        let curDate = moment(new Date());
        let offDate = moment(buyDate).date() - curDate.date();
        return offDate < time;
    }
    return true;
}

function getFreeBomb(data, cb) {
    let account = data.account;
    if (account.social_daily_invite_reward.length >= 2 && account.free_bomb === 0) {
        account.free_bomb = 1;
        account.commit();
    }
    cb(null, { state: account.free_bomb });
}