const RedisUtil = require('../utils/RedisUtil');
const buzz_broadcast = require('../../../../common/broadcast/buzz_broadcast');
const buzz_mail = require('./buzz_mail');
const redisKeys = require('../../../../database').dbConsts.REDISKEY;


exports.addListener = addListener;

/**
 * 添加事件处理器到RedisUtil中.
 */
function addListener() {

    redisConnector.sub(redisKeys.CH.BROADCAST_SERVER, function (data) {
        buzz_broadcast.redisNotifyBroadcast(redisKeys.CH.BROADCAST_SERVER, data);
    });
    redisConnector.sub(redisKeys.CH.BROADCAST_GAME_EVENT, function (data) {
        buzz_broadcast.redisNotifyBroadcast(redisKeys.CH.BROADCAST_GAME_EVENT, data);
    });
    redisConnector.sub(redisKeys.CH.BROADCAST_FAMOUS_ONLINE, function (data) {
        buzz_broadcast.redisNotifyBroadcast(redisKeys.CH.BROADCAST_FAMOUS_ONLINE, data);
    });
    redisConnector.sub(redisKeys.CH.BROADCAST_DRAW, function (data) {
        buzz_broadcast.redisNotifyBroadcast(redisKeys.CH.BROADCAST_DRAW, data);
    });
    redisConnector.sub(redisKeys.CH.BROADCAST_REWARD_PEOPLE, function (data) {
        buzz_broadcast.redisNotifyBroadcast(redisKeys.CH.BROADCAST_REWARD_PEOPLE, data);
    });

    // Channel: Mail
    redisConnector.sub(redisKeys.CH.MAIL_SEND, function (data) {
        buzz_mail.redisNotifyMail(redisKeys.CH.MAIL_SEND, data);
    });
    redisConnector.sub(redisKeys.CH.MAIL_RANK, function (data) {
        buzz_mail.redisNotifyMail(redisKeys.CH.MAIL_RANK, data);
    });
    redisConnector.sub(redisKeys.CH.MAIL_RELOAD, function (data) {
        buzz_mail.reloadMail(redisKeys.CH.MAIL_RELOAD, data);
    });
}
