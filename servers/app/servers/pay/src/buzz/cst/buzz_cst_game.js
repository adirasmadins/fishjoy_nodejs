const CryptoJS = require("crypto-js");
const RedisUtil = require("../../utils/RedisUtil");
const ObjUtil = require("../ObjUtil");
const TimeQueue = ObjUtil.TimeQueue;
const Broadcast = ObjUtil.Broadcast;
const tools = require('../../../../../utils/tools');
const redisAccountSync = require('../../../../../utils/redisAccountSync');
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
    SERVER:         1,
    GAME_EVENT:     2,
    FAMOUS_ONLINE:  3,
    DRAW:           4,
};

const _GAME_EVENT_TYPE = {
    BOSS_KILL:      1,
    WEAPON_UPGRADE: 2,
    SKIN_GOT:       3,
    TOOL_GOT:       4,
    GOLDFISH_DRAW:  5,
    GODDESS_UNLOCK: 6,
    GODDESS_UPGRADE:7,
    GODDESS_CHALLENGE:8,
    DRAW_REWARD:9,
    VICTORS:10,
    REWARD_PEOPLE:  11,
};

const FAMOUS_ONLINE_TYPE = {
    GOLD: 1,
    ACHIEVE: 2,
    COMPETITION: 3,
    CHARM:4   //万人迷
};

const PLATFORM = {
    ANDROID: 1,
    IOS: 2,
};

//==============================================================================
// letiable
//==============================================================================
// android和ios分离
let broadcast_gameevent_android = new TimeQueue(5000, 60000, 10, 500);
let broadcast_famousonline_android = new TimeQueue(5000, 60000, 3, 10);
let broadcast_draw_android = new TimeQueue(5000, 100000000, 20, 100);
let broadcast_rewardpeople_android = new TimeQueue(5000,6000,1,100);
let broadcast_gameevent_ios = new TimeQueue(5000, 60000, 10, 500);
let broadcast_famousonline_ios = new TimeQueue(5000, 60000, 3, 10);
let broadcast_draw_ios = new TimeQueue(5000, 100000000, 20, 100);
let broadcast_rewardpeople_ios = new TimeQueue(5000,6000,1,100);

exports.getDataObj = getDataObj;
exports.getResData = getResData;
exports.game = _game;
exports.GAME_EVENT_TYPE = _GAME_EVENT_TYPE;
exports.FAMOUS_ONLINE_TYPE = FAMOUS_ONLINE_TYPE;
exports.PLATFORM = PLATFORM;
exports.addBroadcastGameEvent = addBroadcastGameEvent;
exports.addBroadcastDraw = addBroadcastDraw;
//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------

function addBroadcastGameEvent(content) {
    _setBroadcastGameEvent(content);
}

function addBroadcastDraw(content) {
    _setBroadcastDraw(content);
}

//==============================================================================
// 以下的aes为布尔型变量，表示是否对数据进行加密
// 是否加密由客户端决定, 上传数据选择了加密则返回数据也会是加密形式
//==============================================================================

//----------------------------------------------------------
// 公告系统
//----------------------------------------------------------

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
        if(typeof str_data == 'object'){
            dataObj = str_data;
        }else{
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
