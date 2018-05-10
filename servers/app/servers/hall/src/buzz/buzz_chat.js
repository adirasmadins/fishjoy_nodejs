/**
 * 聊天
 * Created by zhenghang on 2017/9/6.
 */
const CacheAccount = require('./cache/CacheAccount');
const RedisUtil = require('../utils/RedisUtil');
const dao_reward = require('../dao/dao_reward');
const BuzzUtil = require('../utils/BuzzUtil');
const buzz_online = require('./buzz_online');
const async = require('async');
const CstError = require('../../../../consts/fish_error'),
    ERROR_OBJ = CstError.ERROR_OBJ;
const gameConfig = require('../../../../utils/imports').DESIGN_CFG;
const common_const_cfg = gameConfig.common_const_cfg;
const shop_shop_buy_type_cfg = gameConfig.shop_shop_buy_type_cfg;

const REDISKEY = require('../../../../database').dbConsts.REDISKEY;
const MSG = REDISKEY.MSG;
const CHANNEL = REDISKEY.CH;
const DateUtil = require('../../../../utils/DateUtil');
const privateMsgSize = 20;


const TAG = "【buzz_chat】";

function sendChat(dataObj, cb) {
    const FUNC = TAG + "sendChat() --- ";

    let sender = dataObj.token.split("_")[0];
    let receiver = dataObj.receiver;
    //不能和自己对话
    if (dataObj.type != 1 && sender == receiver) {
        cb && cb(ERROR_OBJ.CHAT_ERROR_CANNOT_SEND_MSG_TO_YOURSLEF);
        return;
    }

    async.waterfall([
            function (cb) {
                //检查是否被禁言
                RedisUtil.hget(REDISKEY.TALK_FORBIDDEN, sender, cb);
            }], function (err, res) {
            if (err) {
                cb(err);
            }
            if (res == 1) {
                cb && cb(ERROR_OBJ.CHAT_ERROR_FORBIDDEN_BY_ADMIN);
                return;
            }
            let obj = {
                type: dataObj.type,
                time: new Date().getTime(),
                sender: sender,
                recver: receiver,
                content: dataObj.content,
            };
            //判断发送消息类型type=1世界消息type=0是私人消息type=2是好友请求
            if (dataObj.type == 1) {
                //扣除钻石或者喇叭
                costChat(dataObj, function (err, ret) {
                    if (err) {
                        logger.error(FUNC + "err:", err);
                        cb(err);
                        return;
                    }
                    redisConnector.pub(dataObj.platform != 1 ? REDISKEY.CH.WORLD_CHAT + ":2" : REDISKEY.CH.WORLD_CHAT + ":1", JSON.stringify(obj));
                    cb(err, ret);
                });
            } else if (dataObj.type == 0) {
                let msg = JSON.stringify(obj);
                // let cmds = [];
                // cmds.push(["lpush", `${MSG.PRIVATE_MSG}:${receiver}`, msg]);
                // cmds.push(["ltrim", `${MSG.PRIVATE_MSG}:${receiver}`, 0, privateMsgSize]);
                // cmds.push(["expire", `${MSG.PRIVATE_MSG}:${receiver}`, DateUtil.SECONDS_IN_ONE_DAY * 2]);
                // cmds.push(["lpush", `${MSG.PRIVATE_MSG}:${sender}`, msg]);
                // cmds.push(["ltrim", `${MSG.PRIVATE_MSG}:${sender}`, 0, privateMsgSize]);
                // cmds.push(["expire", `${MSG.PRIVATE_MSG}:${sender}`, DateUtil.SECONDS_IN_ONE_DAY * 2]);
                // redisConnector.cmd.multi(cmds).exec();
                redisConnector.pub(REDISKEY.CH.PRIVATE_CHAT, JSON.stringify(obj));
                //返回在线状态
                buzz_online.isOnline(receiver, function (err, is_online) {
                    let ret = {
                        online: is_online
                    };
                    logger.info(FUNC + "is_online:", is_online);
                    cb(null, ret);
                });
            } else if (dataObj.type == 2) {
                friendAsk(dataObj, function (err, f) {
                    if (err) {
                        cb(err);
                        return;
                    }
                    cb(null, f);
                });
            }
        }
    );
}

const userInfoFields = [
    'id',
    'nickname',
    'match_rank',
    'vip',
    'weapon',
    'weapon_skin',
    'figure_url',
    'level',
    'sex',
    'city',
    "charm_rank",
    "game_friend"
];

async function userInfo(dataObj, cb) {
    let ids = dataObj.uids;
    let id = +dataObj.token.split("_")[0];
    if (!ids) {
        cb(ERROR_OBJ.PARAM_MISSING);
        return;
    }
    let results = [];
    let faccounts = await CacheAccount.getAccountsFieldsByIdsSync(ids, userInfoFields);
    let account = await CacheAccount.getAccountFieldByIdSync(id, ['game_friend']);
    for (let i = 0; i < faccounts.length; i++) {
        let faccount = faccounts[i];
        let result = {};
        result.uid = faccount.id;
        result.nickname = faccount.nickname;
        result.vip = faccount.vip;
        result.figure_url = faccount.figure_url;
        result.sex = faccount.sex;
        result.city = faccount.city;
        result.charm_rank = faccount.charm_rank;
        result.wp = faccount.weapon;
        result.skin = faccount.weapon_skin.own;
        result.lv = faccount.level;
        result.rank = faccount.match_rank;
        let game_friend = account.game_friend;
        result.friend = 0;
        for (let i = 0; i < game_friend.length; i++) {
            let friend = +game_friend[i];
            if (friend === faccount.id) {
                result.friend = 1;
                break;
            }
        }
        results.push(result);
    }
    cb(null, results);
}

/**
 * 扣除钻石或者喇叭
 * @type {userInfo}
 */
function costChat(data, cb) {
    const FUNC = TAG + "costChat() --- ";
    doNextWithAccount(data.account, cb);

    function doNextWithAccount(account, cb) {
        let coinType = shop_shop_buy_type_cfg.CHAT_COST.name;
        let coinId = shop_shop_buy_type_cfg.CHAT_COST.id;
        let worldlabapearl = common_const_cfg.WORLD_LABA_PEARL;
        let item1 = [['i006', 1]];
        let item2 = [[coinId, worldlabapearl]];
        if (dao_reward.enough(account, item1)) {
            let tmp1 = [{
                item_id: item1[0][0],
                item_num: item1[0][1]
            }];
            //使用一个喇叭，增加对应魅力值
            remove(account, tmp1);
        } else if (dao_reward.enough(account, item2)) {
            let tmp2 = [{
                item_id: item2[0][0],
                item_num: item2[0][1]
            }];
            remove(account, tmp2);
        } else {
            cb(ERROR_OBJ.CHAT_COST_ERROR);
        }

    }

    function remove(account, costitem) {
        BuzzUtil.removeFromPack(account, costitem, function (cost_info) {
            logger.info(FUNC + "cost_info:", cost_info);
            let change = BuzzUtil.getChange(account, cost_info);
            let ret = {
                item_list: costitem,
                change: change
            };

            RedisUtil.hincr(REDISKEY.HORN_USED, account.id, function (err, res) {
                if (err) {
                    cb(null, ret);
                    return;
                }
                //使用喇叭增加魅力值上限3000点
                if (res <= 3000) {
                    CacheAccount.setCharmPointWithUsingOneHorn(account, function (chs) {
                        if (chs && chs.length == 2) {
                            let charmPoint = chs[0];
                            let charmRank = chs[1];
                            charmPoint >= 0 && (ret.change.charm_point = charmPoint);
                            charmRank >= 0 && (ret.change.charm_rank = charmRank);
                        }
                        logger.info(FUNC + "ret:", ret);
                        cb(null, ret);
                    });
                }
                else {
                    cb(null, ret);
                }
            });
        });
    }
}

/**
 * 使用redis的有序集合存储好友请求消息
 * @param dataObj
 * @param cb
 */
async function friendAsk(dataObj, cb) {
    let id = +dataObj.receiver;
    let uid = +dataObj.token.split("_")[0];
    if (id === uid) {
        cb && cb(ERROR_OBJ.CHAT_ERROR_CANNOT_ADD_YOURSELF_AS_FRIEND);
        return;
    }
    let account = await CacheAccount.getAccountFieldByIdSync(uid, ['game_friend', "vip"]);
    let faccount = await CacheAccount.getAccountFieldByIdSync(id, ['game_friend', "vip"]);
    let gameFriend = account.game_friend;
    let vip = account.vip;
    let fgameFriend = faccount.game_friend;
    let fvip = faccount.vip;
    if (BuzzUtil.getMaxFriendNum(vip) <= gameFriend.length) {
        cb && cb(ERROR_OBJ.CHAT_ERROR_FRIEND_LIMIT_ME);
        return;
    }
    else if (BuzzUtil.getMaxFriendNum(fvip) <= fgameFriend.length) {
        cb && cb(ERROR_OBJ.CHAT_ERROR_FRIEND_LIMIT_TARGET);
        return;
    }
    const key = `${REDISKEY.MSG.ASK_FRIEND}:${id}`;
    const res = await redisConnector.zrangewithscores(key, 0, -1);
    const len = res.length;
    for (let i = 0; i < len; i += 2) {
        if (res[i] == uid) {
            cb(null, []);
            return;
        }
    }
    RedisUtil.zadd(key, new Date().getTime(), uid);
    cb(null, []);
}

function forbid_player_world(dataObj, cb) {
    const FUNC = TAG + "forbid_player_world() --- ";
    logger.info(FUNC + "call---");
    let id = dataObj.uid;
    let forbiddenId = dataObj.forbiddenId;
    async.waterfall([
            function (cb) {
                RedisUtil.hget(REDISKEY.MSGBOARD_MGMT, id, cb);
            },
            function (isAdmin, cb) {
                if (isAdmin == 0) {
                    cb(1);
                } else {
                    RedisUtil.hget(REDISKEY.MSGBOARD_MGMT, forbiddenId, cb);
                }
            },
            function (isAdmin2, cb) {
                if (isAdmin2 == 1) {
                    cb(2);
                } else {
                    RedisUtil.hset(REDISKEY.TALK_FORBIDDEN, forbiddenId, 1, cb);
                }
            }
        ], function (err, data) {
            if (err == 1) {
                logger.error(`非管理员${id}调用此接口`);
                cb();
                return;
            }
            else if (err == 2) {
                logger.error("请不要禁言管理员，请后台操作!");
                cb();
                return;
            }
            logger.info("禁言成功", data);
            cb(err, forbiddenId);
        }
    );
}

function unforbid_player_world(dataObj, cb) {
    const FUNC = TAG + "forbid_player_world() --- ";
    logger.info(FUNC + "call---");
    let token = dataObj.token;
    let id = token.split("_")[0];
    let forbiddenId = dataObj.forbiddenId;
    async.waterfall([
            function (cb) {
                RedisUtil.hget(REDISKEY.MSGBOARD_MGMT, id, cb);
            },
            function (isAdmin, cb) {
                if (isAdmin == 0) {
                    cb(1);
                } else {
                    RedisUtil.hset(REDISKEY.TALK_FORBIDDEN, forbiddenId, 0, cb);
                }
            }
        ], function (err, data) {
            if (err == 1) {
                logger.error(`非管理员${id}调用此接口`);
                cb();
                return;
            }
            cb(err, data);
        }
    );
}

exports.userInfo = userInfo;
exports.sendChat = sendChat;
exports.forbid_player_world = forbid_player_world;
exports.unforbid_player_world = unforbid_player_world;