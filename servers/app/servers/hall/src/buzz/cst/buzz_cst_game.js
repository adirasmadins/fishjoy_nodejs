const CryptoJS = require("crypto-js");
const RedisUtil = require("../../utils/RedisUtil");
const ObjUtil = require("../ObjUtil");
const TimeQueue = ObjUtil.TimeQueue;
const Broadcast = ObjUtil.Broadcast;
const tools = require('../../../../../utils/tools');
const redisAccountSync = require('../../../../../utils/redisAccountSync');
const cache = require('../../rankCache/cache');
const RANK_TYPE = require('../../rankCache/cacheConf').RANK_TYPE;
const redisKeys = require('../../../../../database').dbConsts.REDISKEY;


const TAG = "【buzz_cst_game】";

/**
 * 游戏常量(加密key, 服务器版本)
 */
const _game = {
    key: "THIS_IS_A_TEST_KEY1029384756",
    version: "0.0.1",
};

const BROADCAST_TYPE = {
    SERVER: 1,
    GAME_EVENT: 2,
    FAMOUS_ONLINE: 3,
    DRAW: 4,
};

const _GAME_EVENT_TYPE = {
    BOSS_KILL: 1,
    WEAPON_UPGRADE: 2,
    SKIN_GOT: 3,
    TOOL_GOT: 4,
    GOLDFISH_DRAW: 5,
    GODDESS_UNLOCK: 6,
    GODDESS_UPGRADE: 7,
    GODDESS_CHALLENGE: 8,
    DRAW_REWARD: 9,
    VICTORS: 10,
    REWARD_PEOPLE: 11,
};

const FAMOUS_ONLINE_TYPE = {
    GOLD: 1,
    ACHIEVE: 2,
    COMPETITION: 3,
    CHARM: 4   //万人迷
};

const PLATFORM = {
    ANDROID: 1,
    IOS: 2,
};

//==============================================================================
// letiable
//==============================================================================
let broadcast_server = null;//{timestamp: _timestamp(), content: {txt: 'Welcome!', times: 1}};
// android和ios分离
let broadcast_gameevent_android = new TimeQueue(5000, 60000, 10, 500);
let broadcast_famousonline_android = new TimeQueue(5000, 60000, 3, 10);
let broadcast_draw_android = new TimeQueue(5000, 100000000, 20, 100);
let broadcast_rewardpeople_android = new TimeQueue(5000, 6000, 1, 100);
let broadcast_gameevent_ios = new TimeQueue(5000, 60000, 10, 500);
let broadcast_famousonline_ios = new TimeQueue(5000, 60000, 3, 10);
let broadcast_draw_ios = new TimeQueue(5000, 100000000, 20, 100);
let broadcast_rewardpeople_ios = new TimeQueue(5000, 6000, 1, 100);

exports.getDataObj = getDataObj;
exports.getResData = getResData;
exports.game = _game;
exports.GAME_EVENT_TYPE = _GAME_EVENT_TYPE;
exports.FAMOUS_ONLINE_TYPE = FAMOUS_ONLINE_TYPE;
exports.PLATFORM = PLATFORM;
exports.getBroadcast = getBroadcast;
exports.setBroadcast = setBroadcast;
exports.addBroadcastGameEvent = addBroadcastGameEvent;
exports.addBroadcastFamousOnline = addBroadcastFamousOnline;
exports.addBroadcastDraw = addBroadcastDraw;
exports.addBroadcastRewardPeople = addBroadcastRewardPeople;
exports.redisNotifyBroadcast = redisNotifyBroadcast;
exports.addFamousOnlineBroadcast = addFamousOnlineBroadcast;
//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------

/**
 * 返回三种公告对象
 */
function getBroadcast(dataObj, cb) {
    const FUNC = TAG + "getBroadcast() --- ";

    //屏蔽默认系统公告
    let lServer = _getBroadcastServer(dataObj.server); 
    let lGameEvent = _getBroadcastGameEvent(dataObj.gameevent, dataObj.platform);
    let lFamousOnline = _getBroadcastFamousOnline(dataObj.famousonline, dataObj.platform);
    let lDraw = _getBroadcastDraw(dataObj.draw, dataObj.platform);
    let lRewardPeople = _getBroadcastRewardPeople(dataObj.rewardpeople, dataObj.platform);

    let token = dataObj.token;
    let cik_on = 0;
    if (token != null) {
        let uid = token.split('_')[0];
        redisAccountSync.getAccount(uid, function (err, account) {
            RedisUtil.get(redisKeys.SWITCH.CIK, function (err, res) {
                if (err) return cb && cb(err);
                if (null == res) {
                    res = 1;
                }
                let switch_cik = parseInt(res);
                if (account != null) {
                    let account_cik_on = account.cik_on;
                    cik_on = switch_cik && account_cik_on;

                    if (tools.BuzzUtil.isCheat(account)) {
                        cik_on = 0;
                    }

                    cb && cb(null, {
                        server: lServer,
                        gameevent: lGameEvent,
                        famousonline: lFamousOnline,
                        draw: lDraw,
                        cik_on: cik_on,
                        rewardpeople: lRewardPeople
                    });

                }
            });
        });

    }


}

function setBroadcast(dataObj, req) {
    const FUNC = TAG + "setBroadcast() --- ";

    let token = dataObj.token;
    let broadcastType = dataObj.type;
    logger.info(FUNC + 'broadcastType: ', broadcastType);
    logger.info(FUNC + 'content: ', dataObj.content);
    logger.info(FUNC + '1-platform: ', dataObj.platform);
    logger.info(FUNC + 'content_type: ', dataObj.content.type);

    // broadcastType为空(默认为系统公告), 或为SERVER
    if (BROADCAST_TYPE.SERVER == broadcastType || !broadcastType) {
        _setBroadcastServer(dataObj.content);
    }
    else if (BROADCAST_TYPE.GAME_EVENT == broadcastType
        && dataObj.content
        && _GAME_EVENT_TYPE.VICTORS == dataObj.content.type) {
        logger.info(FUNC + "连胜公告, 直接由房间服务器发送, 无需token");
        _setBroadcastGameEvent(dataObj.content);
    }
    else {
        // TODO: 验证token
        myDao.getAccountByToken(token, function (err, results) {
            if (err) {
                logger.error("buzz_cst_game.setBroadcast(): 使用token查询账户出现数据库错误");
                //cb();
                return;
            }
            if (results.length == 0) {
                logger.error("buzz_cst_game.setBroadcast(): 使用token查询账户不存在");
                //cb();
                return;
            }
            let result = results[0];

            // 公告需要在Android和iOS分离
            // let platform = result.platform;
            dataObj.content.platform = result.platform;

            logger.info(FUNC + '2-platform: ', result.platform);
            logger.info('账户' + result.id + '发出了广播消息');

            if (BROADCAST_TYPE.GAME_EVENT == broadcastType) {
                _setBroadcastGameEvent(dataObj.content);
            }
            else if (BROADCAST_TYPE.FAMOUS_ONLINE == broadcastType) {
                _setBroadcastFamousOnline(dataObj.content);
            }
            else if (BROADCAST_TYPE.DRAW == broadcastType) {
                _setBroadcastDraw(dataObj.content);
            }
        });
    }
}

function addBroadcastGameEvent(content) {
    _setBroadcastGameEvent(content);
}

function addBroadcastFamousOnline(content) {
    _setBroadcastFamousOnline(content);
}

function addBroadcastDraw(content) {
    _setBroadcastDraw(content);
}

function addBroadcastRewardPeople(content) {
    _setBroadcastRewardPeople(content);
}

//==============================================================================
// 以下的aes为布尔型变量，表示是否对数据进行加密
// 是否加密由客户端决定, 上传数据选择了加密则返回数据也会是加密形式
//==============================================================================

//----------------------------------------------------------
// 公告系统
//----------------------------------------------------------
// GET
// DONE: 只取客户端时间戳之后的数据
function _getBroadcastServer(timestamp) {
    if (!broadcast_server) {
        return null;
    }
    // logger.error('---------------timestamp:', timestamp);
    // logger.error('---------------broadcast_server:', broadcast_server);
    if (!timestamp || timestamp < broadcast_server.timestamp) {
        return broadcast_server;
    }
    return null;
}

function _getBroadcastGameEvent(timestamp, platform) {
    switch (platform) {
        case PLATFORM.IOS:
            return broadcast_gameevent_ios.getRecent(timestamp);
        default:
            return broadcast_gameevent_android.getRecent(timestamp);
    }
}

function _getBroadcastFamousOnline(timestamp, platform) {
    switch (platform) {
        case PLATFORM.IOS:
            return broadcast_famousonline_ios.getRecent(timestamp);
        default:
            return broadcast_famousonline_android.getRecent(timestamp);
    }
}

function _getBroadcastDraw(timestamp, platform) {
    switch (platform) {
        case PLATFORM.IOS:
            return broadcast_draw_ios.getRecent(timestamp);
        default:
            return broadcast_draw_android.getRecent(timestamp);
    }
}

function _getBroadcastRewardPeople(timestamp, platform) {
    switch (platform) {
        case PLATFORM.IOS:
            return broadcast_rewardpeople_ios.getRecent(timestamp);
        default:
            return broadcast_rewardpeople_android.getRecent(timestamp);
    }
}

/**
 * Redis收到公告后通知到对应的变量
 */
function redisNotifyBroadcast(channel, message) {
    const FUNC = TAG + "redisNotifyBroadcast() --- ";
    switch (channel) {
        case redisKeys.CH.BROADCAST_SERVER:
            broadcast_server = message;
            break;
        case redisKeys.CH.BROADCAST_GAME_EVENT:
        case redisKeys.CH.BROADCAST_FAMOUS_ONLINE:
        case redisKeys.CH.BROADCAST_DRAW:
        case redisKeys.CH.BROADCAST_REWARD_PEOPLE: {
            let broadcast = new Broadcast(message.timestamp, message.content);
            let platform = message.content.platform;
            let broadcastQueue = getBroadcastQueue(channel, platform);
            broadcastQueue && broadcastQueue.push(broadcast);
            if (!broadcastQueue) {
                logger.error(FUNC + "channel:", channel);
                logger.error(FUNC + "platform:", platform);
            }
            break;
        }
    }
}

function getBroadcastQueue(channel, platform) {
    if (redisKeys.CH.BROADCAST_GAME_EVENT == channel)
        switch (platform) {
            case PLATFORM.IOS:
                return broadcast_gameevent_ios;
            default:
                return broadcast_gameevent_android;
        }

    if (redisKeys.CH.BROADCAST_FAMOUS_ONLINE == channel)
        switch (platform) {
            case PLATFORM.IOS:
                return broadcast_famousonline_ios;
            default:
                return broadcast_famousonline_android;
        }

    if (redisKeys.CH.BROADCAST_DRAW == channel)
        switch (platform) {
            case PLATFORM.IOS:
                return broadcast_draw_ios;
            default:
                return broadcast_draw_android;
        }

    if (redisKeys.CH.BROADCAST_REWARD_PEOPLE == channel)
        switch (platform) {
            case PLATFORM.IOS:
                return broadcast_rewardpeople_ios;
            default:
                return broadcast_rewardpeople_android;
        }
}


// SET
function _setBroadcastServer(new_broadcast) {
    const FUNC = TAG + "_setBroadcastServer() --- ";
    logger.info(FUNC + "CALL...");

    new_broadcast.times = parseInt(new_broadcast.times);

    // broadcast_server.content = new_broadcast;
    // // DONE: 增加服务器公告的时间戳
    // broadcast_server.timestamp = _timestamp();

    let value = {
        content: new_broadcast,
        timestamp: _timestamp(),
    };
    let message = JSON.stringify(value);

    redisConnector.pub(redisKeys.CH.BROADCAST_SERVER, message);
}

function _setBroadcastGameEvent(new_broadcast) {
    const FUNC = TAG + "_setBroadcastGameEvent() --- ";
    logger.info(FUNC + "CALL...");
    logger.info(FUNC + "platform:", new_broadcast.platform);

    // switch (new_broadcast.platform) {
    //     case PLATFORM.IOS:
    //         broadcast_gameevent_ios.push(new Broadcast(_timestamp(), new_broadcast));
    //     break;
    //     default:
    //         broadcast_gameevent_android.push(new Broadcast(_timestamp(), new_broadcast));
    //     break;
    // }

    // new_broadcast: {platform:?...}
    let value = {
        content: new_broadcast,
        timestamp: _timestamp(),
    };
    let message = JSON.stringify(value);

    redisConnector.pub(redisKeys.CH.BROADCAST_GAME_EVENT, message);

}

function _setBroadcastFamousOnline(new_broadcast) {
    const FUNC = TAG + "_setBroadcastFamousOnline() --- ";
    logger.info(FUNC + "CALL...");
    logger.info(FUNC + "platform:", new_broadcast.platform);

    // switch (new_broadcast.platform) {
    //     case PLATFORM.IOS:
    //         broadcast_famousonline_ios.push(new Broadcast(_timestamp(), new_broadcast));
    //     break;
    //     default:
    //         broadcast_famousonline_android.push(new Broadcast(_timestamp(), new_broadcast));
    //     break;
    // }

    // new_broadcast: {platform:?...}
    let value = {
        content: new_broadcast,
        timestamp: _timestamp(),
    };
    let message = JSON.stringify(value);

    redisConnector.pub(redisKeys.CH.BROADCAST_FAMOUS_ONLINE, message);
}

function _setBroadcastDraw(new_broadcast) {
    const FUNC = TAG + "_setBroadcastDraw() --- ";
    logger.info(FUNC + "CALL...");
    logger.info(FUNC + "platform:", new_broadcast.platform);

    // // CLIENT: 设置为10秒后发送活动抽奖通告
    // // setTimeout(function() {
    //     switch (new_broadcast.platform) {
    //         case PLATFORM.IOS:
    //             broadcast_draw_ios.push(new Broadcast(_timestamp(), new_broadcast));
    //         break;
    //         default:
    //             broadcast_draw_android.push(new Broadcast(_timestamp(), new_broadcast));
    //         break;
    //     }
    // // }, 100000);
    let value = {
        content: new_broadcast,
        timestamp: _timestamp(),
    };
    let message = JSON.stringify(value);

    redisConnector.pub(redisKeys.CH.BROADCAST_DRAW, message);
}

function _setBroadcastRewardPeople(new_broadcast) {
    const FUNC = TAG + "_setBroadcastRewardPeople() --- ";
    logger.info(FUNC + "CALL...");
    logger.info(FUNC + "platform:", new_broadcast.platform);
    let value = {
        content: new_broadcast,
        timestamp: _timestamp(),
    };
    let message = JSON.stringify(value);

    redisConnector.pub(redisKeys.CH.BROADCAST_REWARD_PEOPLE, message);
}


function _timestamp() {
    //return Date.parse(new Date());// 毫秒改成000显示
    return (new Date()).valueOf();
    //return new Date().getTime();
}

//----------------------------------------------------------

/**
 * 从客户端上传数据(经过加密的字符串)获取数据对象(json格式).
 * @throw err SyntaxError: Unexpected end of input
 */
function getDataObj(str_data, aes) {
    let dataObj = {};
    if (aes == true || aes == "true") {
        let bytes = CryptoJS.AES.decrypt(str_data, _game.key);
        str_data = bytes.toString(CryptoJS.enc.Utf8);
    }
    try {
        if (typeof str_data == 'object') {
            dataObj = str_data;
        } else {
            dataObj = JSON.parse(str_data);
        }

    }
    catch (err) {
        throw err;
    }
    return dataObj;
}

/**
 * 将返回对象转换为字符串后进行加密处理返回给客户端.
 */
function getResData(json_data, aes) {
    if (aes == true || aes == "true") {
        return CryptoJS.AES.encrypt(JSON.stringify(json_data), _game.key).toString();
    }
    else {
        return json_data;
    }
}

//万人迷上线公告
function addFamousOnlineBroadcast(account, platform) {
    const FUNC = TAG + "_addBroadcast() --- ";
    logger.info(FUNC + "call:");
    let id = account.id;
    let nickname = account.channel_account_name;
    if (!nickname) nickname = account.nickname;
    if (!nickname) nickname = account.tempname;
    let vip = account.vip;
    let charm = account.charm_rank && parseInt(account.charm_rank) || 0;
    let Charmaccount = cache.getChart(platform, RANK_TYPE.CHARM, 0, 1);
    if (Charmaccount && Charmaccount.length > 0 && id == Charmaccount[0].uid) {
        let content = {
            txt: "",
            times: 1,
            type: FAMOUS_ONLINE_TYPE.CHARM,
            params: [nickname, vip, charm],
            platform: platform
        };
        addBroadcastFamousOnline(content);
    }
    let Matchaccount = cache.getChart(platform, RANK_TYPE.MATCH, 0, 1);
    if (Matchaccount && Matchaccount.length > 0 && id == Matchaccount[0].uid) {
        let content = {
            txt: "",
            times: 1,
            type: FAMOUS_ONLINE_TYPE.COMPETITION,
            params: [nickname, vip, charm],
            platform: platform
        };
        addBroadcastFamousOnline(content);
    }
}