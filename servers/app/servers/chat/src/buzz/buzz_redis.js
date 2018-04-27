const buzz_chat = require('./buzz_chat');
const REDIS_KEYS = require('../../../../database').dbConsts.REDISKEY,
    CHANNEL = REDIS_KEYS.CH;
const feedback = require('../buzz/feedback');

exports.addListener = addListener;

/**
 * 添加事件处理器到RedisUtil中.
 */
function addListener() {
    redisConnector.sub(CHANNEL.WORLD_CHAT+":1", function (data) {
        buzz_chat.worldChat(CHANNEL.WORLD_CHAT+":1",data);
    });
    redisConnector.sub(CHANNEL.WORLD_CHAT+":2", function (data) {
        buzz_chat.worldChat(CHANNEL.WORLD_CHAT+":2",data);
    });
    redisConnector.sub(CHANNEL.PRIVATE_CHAT, function (data) {
        buzz_chat.privateChat(data);
    });
    //留言
    redisConnector.sub(CHANNEL.FEEDBACK, function (data) {
        feedback.update(data);
    });
    redisConnector.sub(CHANNEL.DEL_FEEDBACK, function (data) {
        feedback.del(data);
    });
    redisConnector.sub(CHANNEL.LIKE_FEEDBACK, function (data) {
        feedback.like(data);
    });

}