/**
 * 聊天
 * Created by zhenghang on 2017/9/6.
 */
const DateUtil = require('../../../../utils/DateUtil');
const REDISKEY = require('../../../../database').dbConsts.REDISKEY;
const MSG = REDISKEY.MSG;
const CHANNEL = REDISKEY.CH;


const TAG = "【buzz_chat】";
let privateMsgSize = 20;

//messages 内存存储世界聊天信息
let messages_other = [], messages_ios = [], maxMessage = 200;

//处理世界聊天消息
function worldChat(channel, message) {
    if (!message) return;
    let messages = (channel == CHANNEL.WORLD_CHAT + ":2") ? messages_ios : messages_other;
    message.time = new Date().getTime();
    // 获取发言者的test值
    redisConnector.cmd.hget(REDISKEY.TEST, message.sender, function (err, res) {
        message.test = parseInt(res);
        if (messages.length <= maxMessage) {
            messages.push(message);
        } else {
            messages.shift();
            messages.push(message);
        }
    });

}

//处理私人聊天消息
function privateChat(message) {
    if (!message) return;
    message.time = new Date().getTime();
    //获取sender,receiver
    let recver = message.recver;
    let sender = message.sender;
    message = JSON.stringify(message);
    let cmds = [];
    cmds.push(["lpush", `${MSG.PRIVATE_MSG}:${recver}`, message]);
    cmds.push(["ltrim", `${MSG.PRIVATE_MSG}:${recver}`, 0, privateMsgSize]);
    cmds.push(["expire", `${MSG.PRIVATE_MSG}:${recver}`, DateUtil.SECONDS_IN_ONE_DAY * 2]);
    cmds.push(["lpush", `${MSG.PRIVATE_MSG}:${sender}`, message]);
    cmds.push(["ltrim", `${MSG.PRIVATE_MSG}:${sender}`, 0, privateMsgSize]);
    cmds.push(["expire", `${MSG.PRIVATE_MSG}:${sender}`, DateUtil.SECONDS_IN_ONE_DAY * 2]);
    redisConnector.cmd.multi(cmds).exec();
}

//拉取聊天信息
function getChat(dataObj, cb) {
    const FUNC = TAG + "getChat() --- ";
    let requestUid = dataObj.uid;
    let re = {time: new Date().getTime()};
    let result = [];
    //筛选
    let messages = dataObj.platform != 1 ? messages_ios : messages_other;
    let timestamp = dataObj.logintime;
    let count = dataObj.count || 12;
    let n = 0;
    for (let i = messages.length - 1; i >= 0; i--) {
        let info = messages[i];
        if (info.time > timestamp) {
            if ((info.test >= 0) || (info.test < 0 && info.sender == requestUid)) {
                result.push(info);
                n++;
            }
            if (timestamp == 0 && n > count) break;
        } else {
            break;
        }
    }
    //拉取私人聊天信息
    getPrivateMessage(dataObj, function (err, r) {
        //re.msg = result.concat(r);
        //拉取好友请求
        let tmp = [];
        if (r) tmp = result.concat(r);
        getFriendAskMsg(dataObj, function (err, reply) {
            if (err) {
                cb(err);
                return;
            }
            if (reply) tmp = tmp.concat(reply);
            re.msg = tmp;
            cb(null, re);
        });
    });
}

//拉取私人聊天信息
function getPrivateMessage(dataObj, cb) {
    let uid = dataObj.token.split("_")[0];
    let timestamp = dataObj.timestamp;
    let result = [];
    redisConnector.cmd.lrange(`${MSG.PRIVATE_MSG}:${uid}`, 0, -1, function (err, res) {
        if (err) {
            cb(err);
            return;
        }
        if (res) {
            for (let i = 0; i < res.length; i++) {
                let obj = JSON.parse(res[i]);
                // logger.info(FUNC + "obj:", obj);
                // logger.info(FUNC + "time:", timestamp, obj.time);
                if (obj.time > timestamp) {
                    result.push(obj);
                } else {
                    break;
                }
            }
        }
        cb(null, result);
    });
}


/**
 * 使用有序集合处理好友请求消息
 * @param dataObj
 * @param cb
 */
function getFriendAskMsg(dataObj, cb) {
    const FUNC = TAG + "getFriendAskMsg() --- ";
    let uid = dataObj.token.split("_")[0];
    let timestamp = +dataObj.applytime;
    //let timestamp = dataObj.timestamp;
    // logger.info(FUNC + "timestamp:", timestamp);
    let result = [];
    let key = `${MSG.ASK_FRIEND}:${uid}`;
    redisConnector.cmd.zrangebyscore(key, timestamp + 1, new Date().getTime(), function (err, reply) {
        if (err) {
            logger.error(err);
            cb(err);
            return;
        }
        if (reply) {
            let data = [];
            for (let i = 0; i < reply.length; i++) {
                data.push(["zscore", key, reply[i]]);
            }
            redisConnector.cmd.multi(data).exec(function (err, replies) {
                if (err) {
                    cb(err);
                    return;
                }
                for (let i = 0; i < replies.length; i++) {
                    let obj = {
                        type: 2,
                        time: replies[i],
                        sender: reply[i],
                        recver: uid,
                        content: ""
                    };
                    result.push(obj);
                }
                // logger.info(FUNC + "getFriendAskMsg1:", result);
                cb(null, result);
            });
        } else {
            cb(null, result);
        }
    });
}


exports.getChat = getChat;
exports.worldChat = worldChat;
exports.privateChat = privateChat;