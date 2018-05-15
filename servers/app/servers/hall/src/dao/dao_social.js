const ObjUtil = require('../buzz/ObjUtil');
const RedisUtil = require('../utils/RedisUtil');
const ArrayUtil = require('../utils/ArrayUtil');
const buzz_cst_error = require('../../../../consts/fish_error');
const ERROR_OBJ = buzz_cst_error.ERROR_OBJ;
const DateUtil = require('../utils/DateUtil');
const dao_reward = require('./dao_reward');
const dao_gold = require('./dao_gold');
const CacheAccount = require('../buzz/cache/CacheAccount');
const RANK_TYPE = require('../rankCache/cacheConf').RANK_TYPE;
const gameConfig = require('../../../../utils/imports').DESIGN_CFG;
const social_friend_cfg = gameConfig.social_friend_cfg;
const social_friendfirst_cfg = gameConfig.social_friendfirst_cfg;
const social_sharefirst_cfg = gameConfig.social_sharefirst_cfg;
const social_share_cfg = gameConfig.social_share_cfg;
const common_const_cfg = gameConfig.common_const_cfg;
const common_log_const_cfg = gameConfig.common_log_const_cfg;
const redisAccountSync = require('../../../../utils/redisAccountSync');
const cache = require('../rankCache/cache');
const RewardModel = require('../../../../utils/account/RewardModel');
const GameEventBroadcast = require('../../../../common/broadcast/GameEventBroadcast');

const TAG = "【dao_social】";

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

// 分享的状态
const SHARE_STATUS = {
    /** 待分享 */
    SHARE: 0,
    /** 未领取 */
    REWARD: 1,
    /** 已领取 */
    GOTTEN: 2,
};

// 分享的重复类型
const REPEAT_TYPE = {
    /** 不重置 */
    NONE: 0,
    /** 每日重置 */
    DAILY: 1,
    /** 每周重置 */
    WEEKLY: 2,
};


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
exports.resetWeeklyShare = resetWeeklyShare;
exports.setShareTopGold = setShareTopGold;
exports.getInviteDailyReward = getInviteDailyReward;
exports.resetDaillyShare = resetDaillyShare;
//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------

/**
 * 获取好友邀请进度.
 */
async function getInviteProgress(dataObj, cb) {
    let account = dataObj.account;
    let friends = account.social_invite_friends;
    account.social_invite_friends = friends;
    if (typeof friends != 'object') {
        logger.error(`getInviteProgress:${account.id},${friends}`);
    }
    account.commit();
    // 需要计算邀请的好友是否已经达到了50倍炮的倍率.
    let invite_progress = 0;
    for (let i = 0; i < friends.length; i++) {
        try {
            let faccount = await CacheAccount.getAccountFieldByIdSync(friends[i], ['weapon']);
            if (faccount.weapon >= 50) invite_progress++;
        } catch (err) {
            logger.error("getInviteProgress:", err);
        }
    }

    cb(null, {
        invite_progress: invite_progress,
        invite_reward: account.social_invite_reward,
        invite_time_count: [
            account.social_daily_invite_reward.length,
            account.social_invite_week.length,
            account.social_invite_month.length
        ],
        invite_daily_reward: account.social_invite_daily_state
    });
}

/**
 * 获取好友分享状态.
 */
function getShareStatus(dataObj, cb) {
    let account = dataObj.account;
    let uid = dataObj.uid;
    let share_status = account.social_share_status_0;
    share_status = ObjUtil.merge(share_status, account.social_share_status_1);
    share_status = ObjUtil.merge(share_status, account.social_share_status_2);
    let ret = {};
    ret.share_status = share_status;

    let mission = null;
    if (account.match_rank > 25) {
        ret.share_top_rank = 1;
        let cfg = getShareById(107);
        mission = new RewardModel(account);
        mission.addProcess(RewardModel.TaskType.CHALLENGE_POS, cfg.value2, cfg.value1); //最强王者标记
    }
    let charm = cache.getRank(account.platform, RANK_TYPE.CHARM, uid);
    if (charm.my_rank < 11) {
        ret.share_top_gold = 1;
        let cfg = getShareById(106);
        (!mission) && (mission = new RewardModel(account));
        mission.addProcess(RewardModel.TaskType.GOLD_FIRST, cfg.value2, cfg.value1); //首富标记 0不是，1是，下同
    }
    account.commit();
    logger.info("ret:", ret);
    cb(null, ret);
}

/**
 * 获取好友收藏状态.
 */
function getEnshrineStatus(dataObj, cb) {
    let account = dataObj.account;
    cb(null, {enshrine_status: account.social_enshrine_status});
}

/**
 * 接收邀请好友进度记录.
 */
function inviteSuccess(dataObj, cb) {
    let type = dataObj["type"]; // 100(邀请) | 101(分享)
    let fuid = dataObj["fuid"]; // 邀请者的uid
    let account = dataObj.account;
    let isNew = false;
    if (!account.jointype) {
        account.jointype = type;
        isNew = true;
    }
    let id = account.id;
    if (id == fuid) {
        cb && cb(ERROR_OBJ.CANNOT_INVITE_YOURSLEF);
        return;
    }
    if (type !== JOIN_TYPE.SELF) {
        CacheAccount.getAccountById(fuid, function (err, faccount) {
            if (err) {
                logger.error(err);
                cb(err);
                return;
            }
            if (type === JOIN_TYPE.INVITE) {
                if (isNew) account.who_invite_me = fuid;
                let socialInviteFriends = faccount.social_invite_friends;
                if (socialInviteFriends.indexOf(id) === -1) {
                    socialInviteFriends.push(id);
                    faccount.social_invite_friends = socialInviteFriends;
                }
            } else if (type === JOIN_TYPE.SHARE) {
                if (isNew) account.who_share_me = fuid;
                let socialShareFriends = faccount.social_share_friends;
                if (socialShareFriends.indexOf(id) === -1) {
                    socialShareFriends.push(id);
                    faccount.social_share_friends = socialShareFriends;
                }
            }
            let socialDailyInvite = faccount.social_daily_invite_reward;
            if (socialDailyInvite.indexOf(id) === -1) {//本日邀请数量
                socialDailyInvite.push(id);
                faccount.social_daily_invite_reward = socialDailyInvite;
            }
            if (isNew && (type === JOIN_TYPE.INVITE || type === JOIN_TYPE.SHARE)) {
                let socialInviteWeek = faccount.social_invite_week; //本周邀请数量
                if (socialInviteWeek.indexOf(id) === -1) {
                    socialInviteWeek.push(id);
                    faccount.social_invite_week = socialInviteWeek;
                }
                let socialInviteMonth = faccount.social_invite_month; //本月邀请数量
                if (socialInviteMonth.indexOf(id) === -1) {
                    socialInviteMonth.push(id);
                    faccount.social_invite_month = socialInviteMonth;
                }
            }
            faccount.commit();
        });
    }
    account.commit();
    cb(null, {is_ok: 1});
}

/**
 * 分享成功记录.
 */
function shareSuccess(dataObj) {
    let account = dataObj.account;
    let share_id = dataObj["share_id"]; // 100(邀请) | 101(分享)
    _updateTableSocialWithShare(account, share_id, SHARE_STATUS.REWARD);
    account.commit();
}

/**
 * 快捷方式相关(创建, 领取奖励).
 */
function enshrineSuccess(dataObj) {
    let account = dataObj.account;
    if (account.social_enshrine_status > status) {
        logger.error("enshrineSuccess err,原状态:" + account.social_enshrine_status + ", 想设置的状态:" + status);
        return;
    }
    account.social_enshrine_status = status;
    account.commit();
}

/**
 * 社交奖励领取.
 */
function getSocialReward(dataObj, cb) {
    let account = dataObj.account;
    let type = dataObj["type"];
    let share_id = dataObj["share_id"];
    let reward = _getRewardObj(account, type, share_id);
    if (reward.length > 0) {
        dao_reward.getReward(account, reward, function () {
            // 领奖后根据type设置状态
            _afterReward(type, account, share_id);
            cb(null, {
                gold: account.gold,
                pearl: account.pearl,
                skill: account.skill,
                package: account.package,
                has_new_mail: account.has_new_mail,
                charm_point: account.charm_point,
                charm_rank: account.charm_rank
            });
            let scene = common_log_const_cfg.SHARE_REWARD;
            if (SOCIAL_REWARD_TYPE.INVITE == type || SOCIAL_REWARD_TYPE.INVITE_DAILY == type) {
                scene = common_log_const_cfg.INVITE_REWARD;
            } else if (SOCIAL_REWARD_TYPE.ENSHRINE == type) {
                scene = common_log_const_cfg.ENSHRINE_REWARD;
                account.social_enshrine_status = 2;
                // 发送公告13-收藏领奖
                let params = [account.nickname];
                let content = {
                    type: GameEventBroadcast.TYPE.GAME_EVENT.COLLECTION,
                    params: params,
                };
                new GameEventBroadcast(content).extra(account).add();
            } else if (SOCIAL_REWARD_TYPE.FIST_SHARE == type) {
                scene = common_log_const_cfg.ACTIVE_DRAW;
            }
            account.commit();
            logBuilder.addGoldAndItemLog(reward, account, scene);
        });
    } else {
        cb && cb(ERROR_OBJ.SOCIAL_REWARD_NOT_SATISFIED);
    }
}

/**
 * 添加钻石日志
 */
function addSocialDiamondLog(uid, account, reward, type) {
    const FUNC = TAG + "addSocialDiamondLog() --- ";
    //----------------------------------
    // yDONE: 钻石数据记录
    let gain = 0;
    let item_list = [];
    // reward = [["i002",10],["i001",10000]]
    for (let i = 0; i < reward.length; i++) {
        let item = reward[i];
        let item_id = item[0];
        let item_num = item[1];
        if ('i002' == item_id) {
            gain += item_num;
        }
        item_list.push({item_id: item_id, item_num: item_num});
    }

    if (gain > 0) {
        let scene = common_log_const_cfg.SHARE_REWARD;
        if (JOIN_TYPE.INVITE == type || JOIN_TYPE.INVITE_DAILY == type) {
            scene = common_log_const_cfg.INVITE_REWARD;
        } else if (JOIN_TYPE.ENSHRINE == type) {
            scene = common_log_const_cfg.ENSHRINE_REWARD;
        }

        logBuilder.addPearlLogEx({
            account_id: uid,
            log_at: new Date(),
            gain: gain,
            cost: 0,
            total: account.pearl,
            scene: scene,
            nickname: 0,
        });
        logBuilder.addGoldAndItemLog(item_list, account, scene);
    }
}

function addSocialGoldLog(pool, uid, token, account, reward, type) {
    const FUNC = TAG + "addSocialGoldLog() --- ";
    //----------------------------------
    // yDONE: 金币数据记录
    let gain = 0;
    let cost = 0;
    // reward = [["i002",10],["i001",10000]]
    for (let i = 0; i < reward.length; i++) {
        let item = reward[i];
        let item_id = item[0];
        let item_num = item[1];
        if ('i001' == item_id) {
            gain += item_num;
        }
    }

    if (gain > 0) {
        let scene = common_log_const_cfg.SHARE_REWARD;
        if (JOIN_TYPE.INVITE == type || JOIN_TYPE.INVITE_DAILY == type) {
            scene = common_log_const_cfg.INVITE_REWARD;
        } else if (JOIN_TYPE.ENSHRINE == type) {
            scene = common_log_const_cfg.ENSHRINE_REWARD;
        }

        let data = {
            account_id: uid,
            token: token,
            total: account.gold,
            duration: 0,
            group: [{
                "gain": gain,
                "cost": cost,
                "scene": scene,
            }],
        };

        if (JOIN_TYPE.SHARE == type) {
            logger.info(FUNC + "分享插入一条金币日志:", data);
        } else if (JOIN_TYPE.INVITE == type || JOIN_TYPE.INVITE_DAILY == type) {
            logger.info(FUNC + "邀请插入一条金币日志:", data);
        } else if (JOIN_TYPE.ENSHRINE == type) {
            logger.info(FUNC + "收藏插入一条金币日志:", data);
        }

        dao_gold.addGoldLogCache(pool, data, function (err, res) {
            if (err) return logger.error(FUNC + "err:", err);
        });
    }
}

function getInviteDailyReward(pool, dataObj, cb) {
    const FUNC = TAG + "getInviteDailyReward() --- ";
    //----------------------------------
    let token = dataObj["token"];
    let type = dataObj["type"];
    let share_id = dataObj["share_id"];
    let uid = token.split("_")[0]; // 受请者的uid
    logger.info(FUNC + "INVITE_DAILY call");

    CacheAccount.getAccountById(uid, function (err, account) {
        if (account.social_invite_daily_state == 1) {
            let reward = _getInviteDailyReward();
            logger.info("reward:", reward);
            if (reward.length > 0) {
                dao_reward.getReward(pool, account, reward, function (err, re) {
                    if (err) {
                        logger.error(FUNC + "getReward err:\n", err);
                    }
                    logger.info(FUNC + "INVITE_DAILY call3");
                    // 领奖后根据type设置状态
                    _afterReward(pool, type, uid, null, null);
                    cb(null, account);
                    addSocialGoldLog(pool, uid, token, account, reward, type);
                    addSocialDiamondLog(uid, account, reward, type);
                });
            } else {
                cb(ERROR_OBJ.ACTIVE_DISSATISFY);
            }
        } else {
            cb(ERROR_OBJ.ACTIVE_DISSATISFY);
        }
    });
}

/**
 * 重置每周分享数据.
 UPDATE tbl_social
 SET share_status_2='{}'
 */
function resetWeeklyShare(pool, id_list, cb) {
    const FUNC = TAG + "resetWeeklyShare() --- ";

    let sql = "";
    sql += "UPDATE tbl_social ";
    sql += "SET share_status_2='{}' ";
    if (id_list) {
        sql += "WHERE id IN (" + id_list + ") ";
    }

    let sql_data = [];

    // 每周重置分享状态.
    RedisUtil.hdel("pair:uid:social_share_status_2");

    logger.info(FUNC + "sql:", sql);
    logger.info(FUNC + "sql_data:", sql_data);

    pool.query(sql, sql_data, function (err, result) {
        cb(err, result);
    });
}

/**
 * 重置每日分享数据.
 UPDATE tbl_social
 SET share_status_1='{}'
 */
function resetDaillyShare(pool, id_list, cb) {
    const FUNC = TAG + "resetDaillyShare() --- ";

    let sql = "";
    sql += "UPDATE tbl_social ";
    sql += "SET share_status_1='{}' ";
    if (id_list) {
        sql += "WHERE id IN (" + id_list + ") ";
    }

    let sql_data = [];

    logger.info(FUNC + "sql:", sql);
    logger.info(FUNC + "sql_data:", sql_data);

    pool.query(sql, sql_data, function (err, result) {
        cb(err, result);
    });
}

/**
 * 成为世界首富且金币数额大于500万时设置share_top_gold
 * @param uid 需要更新字段的玩家ID.
 */
function setShareTopGold(pool, uid) {
    const FUNC = TAG + "setShareTopGold() --- ";

    _getSocialData(pool, uid, function (err, result) {
        if (err) {
            logger.error(FUNC + "err:", err);
            return;
        }
        if (result.share_top_gold == 0) {
            _didSetShareTopGold(pool, uid);
        }
    });
}

function _didSetShareTopGold(pool, uid) {
    const FUNC = TAG + "_didSetShareTopGold() --- ";

    let sql = "";
    sql += "UPDATE tbl_social ";
    sql += "SET share_top_gold=1 ";
    sql += "WHERE id=? ";

    let sql_data = [uid];

    RedisUtil.hset('pair:uid:social_share_top_gold', uid, 1);

    logger.info(FUNC + "sql:", sql);
    logger.info(FUNC + "sql_data:", sql_data);

    pool.query(sql, sql_data, function (err, result) {
        if (err) {
            logger.error(FUNC + uid + "设置share_top_gold失败");
            return;
        }
        logger.info(FUNC + uid + "设置share_top_gold成功");
    });
}

//==============================================================================
// private
//==============================================================================

/**
 * 获取邀请者的社交数据.
 * @param fuid 邀请者的uid.
 SELECT *
 FROM `tbl_social`
 WHERE id=2687
 */
function _getSocialData(pool, uid, cb) {
    const FUNC = TAG + "_getSocialData() --- ";

    // TODO: 从Redis中获取

    let sql = "";
    sql += "SELECT * ";
    sql += "FROM `tbl_social` ";
    sql += "WHERE id=? ";

    let sql_data = [uid];

    logger.info(FUNC + "sql:\n", sql);
    logger.info(FUNC + "sql_data:\n", sql_data);

    pool.query(sql, sql_data, function (err, results) {
        if (err) {
            logger.error(FUNC + "err:", err);
            cb(err);
            return;
        }
        if (results.length == 0) {
            // 创建一条记录
            _insertTableSocial(pool, uid, function (err, result) {
                if (err) {
                    logger.error(FUNC + "err:", err);
                    cb(err);
                    return;
                }
                _getSocialData(pool, uid, cb);
            });
            return;
        }
        //魅力值和十大高手分享判断
        redisAccountSync.getAccount(uid, ['platform', 'match_rank'], function (err, account) {
            let ret = results[0];
            if (account) {
                if (account.match_rank > 25) {
                    ret.share_top_rank = 1;
                }
                let charm = cache.getRank(account.platform, RANK_TYPE.CHARM, uid);
                if (charm.my_rank < 11) {
                    ret.share_top_gold = 1;
                }
            }
            cb(null, ret);
        });
    });
}


/**
 * 获取邀请好友中炮的倍率达到50倍以上的个数.
 * @param invite_friends 邀请好友的列表字符串, 直接作为参数
 * @param cb 回调函数, 传入进度的值.
 */
function _getFriendsWeaponOver50(pool, invite_friends, uid, cb) {
    const FUNC = TAG + "_getFriendsWeaponOver50() --- ";
    logger.info(FUNC + "invite_friends:", invite_friends);
    if (invite_friends && invite_friends.length > 0) {
        for (let i = 0; i < invite_friends.length; i++) {
            if (invite_friends[i] == null) {
                logger.error(DateUtil.getTime() + FUNC + "ERROR用户数据错误");
                if (cb) cb(0);
                return;
            }
        }
        if (!invite_friends.toString() || invite_friends.toString() == '') {
            logger.error(DateUtil.getTime() + FUNC + "ERROR用户数据错误");
            if (cb) cb(0);
            return;
        }

        logger.info(FUNC + "已经邀请了好友");

        logger.info(FUNC + "invite_friends:", invite_friends);
        logger.info(FUNC + "invite_friends.toString():", invite_friends.toString());

        let sql = "";
        sql += "SELECT COUNT(id) AS invite_progress ";
        sql += "FROM `tbl_account` ";
        sql += "WHERE id IN (" + invite_friends.toString() + ") ";
        sql += "AND `weapon`>=? ";
        let sql_data = [50];

        pool.query(sql, sql_data, function (err, result) {
            if (err) {
                logger.error(FUNC + "err:\n", err);
                logger.error(FUNC + "sql:\n", sql);
                logger.error(FUNC + "sql_data:\n", sql_data);
                if (cb) cb(0);
                return;
            }
            logger.info(FUNC + "result:", result);
            let invite_progress = result[0].invite_progress;
            if (cb) cb(result[0].invite_progress);
        });
    } else {
        logger.info(FUNC + "还没有邀请好友");
        if (cb) cb(0);
    }
}

/**
 * 插入一条社交数据.
 * @param fuid 邀请者的uid.
 * 执行的SQL语句如下
 INSERT INTO tbl_social
 (id, share_status)
 VALUE(1234, '{}')
 */
function _insertTableSocial(pool, fuid, cb) {
    const FUNC = TAG + "_insertTableSocial() --- ";

    let sql = "";
    sql += "INSERT INTO tbl_social ";
    sql += "(id, share_status_0, share_status_1, share_status_2) ";
    sql += "VALUE(?,?,?,?) ";
    sql += " ON DUPLICATE KEY UPDATE share_status_0=VALUES(share_status_0), share_status_1=VALUES(share_status_1), share_status_2=VALUES(share_status_2)";

    let sql_data = [fuid, '{}', '{}', '{}'];

    logger.info(FUNC + "sql:", sql);
    logger.info(FUNC + "sql_data:", sql_data);

    pool.query(sql, sql_data, function (err, result) {
        cb(err, result);
    });
}

/**
 * 更新一条社交数据.
 * @param fuid 邀请者的uid.
 * @param uid 新的受邀者的uid.
 */
function _updateTableSocialWithUid(pool, fuid, uid, invitor_social, type, cb) {
    const FUNC = TAG + "_updateTableSocialWithUid() --- ";

    // let invite_progress = invitor_social.invite_progress;
    let uids = invitor_social.invite_friends;
    if (type == JOIN_TYPE.SHARE) {
        uids = invitor_social.share_friends;
    }

    if (!uids) {
        uids = uid;
        // invite_progress = 1;
    } else {
        // 已经添加的uid就不能重复添加了
        let uids_json = uids.split(",");
        ArrayUtil.addOnly(uids_json, uid);
        uids = uids_json.toString();

        // // TODO: 此处仅记录邀请到的好友人数.
        // if (type == JOIN_TYPE.INVITE) {
        //     invite_progress = uids_json.length;
        // }
    }

    _updateTableSocial(pool, fuid, uids, type, cb);
}

/**
 * 更新tbl_social中的分享状态
 */
function _updateTableSocialWithShare(account, share_id, status) {
    let share = getShareById(share_id);
    let repeat = REPEAT_TYPE.NONE;
    if (share) {
        repeat = share.repeat;
    }
    switch (repeat) {
        case REPEAT_TYPE.WEEKLY: {
            let share_status_2 = account.social_share_status_2;
            if (share_status_2["" + share_id] == 2) {
                return;
            }
            share_status_2["" + share_id] = status;
            account.social_share_status_2 = account.social_share_status_2;
            break;
        }

        case REPEAT_TYPE.DAILY: {
            let share_status_1 = account.social_share_status_1;
            if (share_status_1["" + share_id] == 2) {
                return;
            }
            share_status_1["" + share_id] = status;
            account.social_share_status_1 = account.social_share_status_1;
            break;
        }

        default: {
            let share_status_0 = account.social_share_status_0;
            if (share_status_0["" + share_id] == 2) {
                return;
            }
            share_status_0["" + share_id] = status;
            account.social_share_status_0 = account.social_share_status_0;
            break;
        }

    }
}

function _getShareStatus(account, repeat) {
    let share_status = -1;
    switch (repeat) {
        case REPEAT_TYPE.WEEKLY:
            share_status = account.social_share_status_2;
            break;
        case REPEAT_TYPE.DAILY:
            share_status = account.social_share_status_1;
            break;
        default:
            share_status = account.social_share_status_0;
    }
    return share_status;
}

/**
 * 更新redis中每日邀请领奖记录
 * @param uid
 * @param cb
 * @private
 */
function _updateRedisSocialWithInviteDailyReward(uid) {
    const FUNC = TAG + "_updateRedisSocialWithInviteDailyReward() --- ";
    logger.info(FUNC + "call:");

    CacheAccount.setAccountById(uid, {
        social_invite_daily_state: 2
    });

    // RedisUtil.expire(PAIR.UID_SOCIAL_INVITE_DAILY, DateUtil.getNexyDayBySeconds());
}

/**
 * 更新tbl_social中的收藏状态
 */
function _updateTableSocialWithEnshrine(account, status) {
    const FUNC = TAG + "_updateTableSocialWithEnshrine() --- ";

    if (account.social_enshrine_status > status) {
        logger.error("玩家尝试逆反收藏状态(原状态:" + account.enshrine_status + ", 想设置的状态:" + status + ")");
        return;
    }
    account.social_enshrine_status = status;
    account.commit();
}

/**
 * 更新tbl_social中的邀请进度.
 */
function _updateTableSocialWithInviteProgress(pool, invite_progress, uid, cb) {
    const FUNC = TAG + "_updateTableSocialWithInviteProgress() --- ";

    let sql = "";
    sql += "UPDATE tbl_social ";
    sql += "SET invite_progress=? ";
    sql += "WHERE id=? ";

    let sql_data = [invite_progress, uid];

    logger.info(FUNC + "sql:\n", sql);
    logger.info(FUNC + "sql_data:\n", sql_data);

    pool.query(sql, sql_data, function (err, result) {
        cb(err, result);
    });
}

/**
 * 更新一条社交数据.
 * @param fuid 邀请者的uid.
 * @param uids 所有受邀者的uid(以逗号分隔).
 * 执行的SQL语句如下
 UPDATE tbl_social
 SET invite_friends=?
 WHERE id=?
 */
function _updateTableSocial(pool, fuid, uids, type, cb) {
    const FUNC = TAG + "_updateTableSocial() --- ";

    let sql = "";
    sql += "UPDATE tbl_social ";
    if (type == JOIN_TYPE.INVITE) {
        sql += "SET invite_friends=? ";
        // sql += ",invite_progress=? ";
        RedisUtil.hset("pair:uid:social_invite_friends", fuid, uids);
    } else if (type == JOIN_TYPE.SHARE) {
        sql += "SET share_friends=? ";
        RedisUtil.hset("pair:uid:social_share_friends", fuid, uids);
    }
    sql += "WHERE id=? ";

    let sql_data = [uids];
    // if (type == JOIN_TYPE.INVITE) {
    //     sql_data.push(invite_progress);
    // }
    sql_data.push(fuid);

    logger.info(FUNC + "sql:", sql);
    logger.info(FUNC + "sql_data:", sql_data);

    pool.query(sql, sql_data, function (err, result) {
        cb(err, result);
    });
}

////////////////////////////////////////////////////////////////////////////////
// 获取奖励相关.

/**
 * 获得奖励对象.
 * @param account
 * @param type 奖励类型(0,1,2)
 * @param share_id
 */
function _getRewardObj(account, type, share_id) {
    let reward = [];
    switch (type) {
        case JOIN_TYPE.INVITE:
            // 计算领取奖励的id(根据邀请进度)
            reward = _getInviteReward(account);
            break;

        case JOIN_TYPE.SHARE:
            // 计算领取奖励的id(根据share_id)
            reward = _getShareReward(account, share_id);
            break;

        case JOIN_TYPE.ENSHRINE:
            if (account.social_enshrine_status == 1) {
                // 查询common表common_const_cfg
                reward = common_const_cfg.COLLECTION;
            }
            break;
        case JOIN_TYPE.INVITE_DAILY:
            //每日邀请奖励
            reward = _getInviteDailyReward(account);
            break;
        case JOIN_TYPE.FIST_SHARE:
            //首次抽奖分享
            reward = _getFirstTurntableDrawShare(account);
            break;
    }
    return reward;
}

/**
 * 获得分享奖励.
 * @param account
 * @param share_id 分享任务ID.
 */
function _getShareReward(account, share_id) {
    const FUNC = TAG + "_getShareReward() --- ";

    let share = getShareById(share_id);
    logger.info(FUNC + "share:", share);
    if (share) {
        let repeat = share.repeat;
        let share_status = _getShareStatus(account, repeat);
        // let share_status_json = JSON.parse(share_status);
        logger.info(FUNC + "share_status_json:", share_status);
        let status = share_status["" + share_id]; //状态为1(未领取)时才可以领取
        logger.info(FUNC + "status:", status);

        if (status == SHARE_STATUS.REWARD) {
            return share.reward;
        }
    }
    return [];

}

/**
 * 获得邀请奖励对象.
 */
function _getInviteReward(account) {
    let reward_id = account.social_invite_reward; // 已经领取的邀请奖励ID.
    let next_reward_id = reward_id + 1; // 下一级邀请奖励ID.

    let invite = getInviteById(next_reward_id);
    if (invite) {
        if (account.social_invite_friends && invite.number <= account.social_invite_friends.length) {
            return invite.reward;
        }
    }
    return []; // 没有奖励
}

/**
 * 获得每日邀请奖励INVITE_DAILY.
 */
function _getInviteDailyReward(account) {
    let id = account.social_invite_daily_state + 1;
    let num = account.social_daily_invite_reward.length;
    for (let i = 0; i < social_friendfirst_cfg.length; i++) {
        if (id === social_friendfirst_cfg[i].id && num >= social_friendfirst_cfg[i].number) {
            return social_friendfirst_cfg[i].reward;
        }
    }
    return [];
}

function _getFirstTurntableDrawShare(account) {
    //首次转盘判断
    if (account.first_turntable_draw === 0) {
        return social_sharefirst_cfg[0].reward;
    }
    return [];
}

/**
 * 处理领奖后的各字段设置.
 * @param type 领奖类型: JOIN_TYPE
 * @param account
 * @param share_id
 */
function _afterReward(type, account, share_id) {
    switch (type) {
        case SOCIAL_REWARD_TYPE.INVITE:
            account.social_invite_reward += 1;
            break;
        case SOCIAL_REWARD_TYPE.SHARE:
            _updateTableSocialWithShare(account, share_id, 2);
            break;
        case SOCIAL_REWARD_TYPE.ENSHRINE:
            if (account.social_enshrine_status > 2) {
                logger.error("玩家尝试逆反收藏状态(原状态:" + account.enshrine_status + ", 想设置的状态:" + ")");
                return;
            }
            account.social_enshrine_status = 2;
            break;
        case SOCIAL_REWARD_TYPE.INVITE_DAILY:
            //处理每日邀请领奖记录redis
            account.social_invite_daily_state += 1;
            break;
        case SOCIAL_REWARD_TYPE.FIST_SHARE:
            account.first_turntable_draw = 1;
            break;
    }
    account.commit();
}

//==============================================================================
// 需要转移
//==============================================================================

function getInviteById(id) {
    return getInfoById(social_friend_cfg, id);
}

function getShareById(id) {
    return getInfoById(social_share_cfg, id);
}

/**
 * 通过id获取数组型配置表中的信息.
 */
function getInfoById(cfg, id) {
    for (let i in cfg) {
        let info = cfg[i];
        if (info.id == id) {
            return info;
        }
    }
    return null;
}