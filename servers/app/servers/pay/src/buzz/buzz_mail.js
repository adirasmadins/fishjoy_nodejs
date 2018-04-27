const _ = require('underscore');
const BuzzUtil = require('../utils/BuzzUtil');
const DaoMail = require('../dao/dao_mail');
const CacheAccount = require('./cache/CacheAccount');
const CacheMail = require('./cache/CacheMail');
const MAIL_TYPE = {
    SYS: 1,// 系统
    RANK: 2,// 排行榜
    SPECIFY: 3,// 补偿邮件(指定玩家发送)
};
const redisKeys = require('../../../../database').dbConsts.REDISKEY;


const TAG = "【buzz_mail】";

exports.sendMail = sendMail;
exports.redisNotifyMail = redisNotifyMail;
exports.reloadMail = reloadMail;
exports.addMail = _addMail;
exports.addRankMail = _addRankMail;

//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------

/**
 * 后台发邮件接口.
 */
function sendMail(req, dataObj, cb) {
    const FUNC = TAG + "sendMail() --- ";
    //----------------------------------
    if (!lPrepare(dataObj)) return;
    BuzzUtil.cacheLinkDataApi(dataObj, "open_box");

    _sendMail(req, dataObj, cb);

    function lPrepare(input) {
        return BuzzUtil.checkParams(input, ['type', 'title', 'content', 'reward', 'player_list'], "buzz_mail", cb);
    }
}

/**
 * Redis监听到新的邮件信息
 */
function redisNotifyMail(channel, message) {
    const FUNC = TAG + "redisNotifyMail() --- ";

    switch (channel) {
        case redisKeys.CH.MAIL_SEND:
            _addMail(message);
            break;

        case redisKeys.CH.MAIL_RANK:
            _addRankMail(message);
            break;
    }

}

function reloadMail(pool, channel, message) {
    const FUNC = TAG + "reloadMail() --- ";
    logger.info(FUNC + "channel:", channel);
    logger.info(FUNC + "message:", message);

    DaoMail.loadMail(pool, function () {
    });
}


//==============================================================================
// private
//==============================================================================

/**
 * 后台发邮件接口.
 */
function _sendMail(req, dataObj, cb) {
    const FUNC = TAG + "_sendMail() --- ";
    logger.info(FUNC + "CALL...");

    let type = dataObj.type;
    let title = dataObj.title;
    let content = dataObj.content;
    let reward = dataObj.reward;
    let player_list = dataObj.player_list;

    let pool = req.pool;

    DaoMail.sendMail(pool, dataObj, function (err, insertId) {
        if (err) return cb(err);

        let mid = insertId;

        // 邮件内容加入缓存
        let new_mail = {
            id: mid,
            type: type,
            title: title,
            content: content,
            reward: reward,
            player_list: player_list,
            sendtime: new Date().getTime(),
        };

        if (type == MAIL_TYPE.SYS) {
            DaoMail.addMailForAll(pool, mid, cb);
            CacheAccount.addSysMail(mid);
        }
        else if (type == MAIL_TYPE.SPECIFY) {
            DaoMail.addMailForPlayer(pool, mid, player_list, cb);
            CacheAccount.addSpecifyMail(mid, player_list);
        }
        else {
            cb(err, insertId);
        }
    });

}

/**
 * Redis注册的频道收到消息后向缓存中的用户写入邮件数据
 */
function _addMail(message) {
    const FUNC = TAG + "_addMail() --- ";

    let new_mail = null;
    try {
        new_mail = JSON.parse(message);
    }
    catch (err) {
        logger.error(FUNC + "err:\n", err);
    }

    if (new_mail) {
        CacheMail.push(new_mail);

        let mid = new_mail.id;
        let type = new_mail.type;
        let player_list = new_mail.player_list;

        if (type == MAIL_TYPE.SYS) {
            CacheAccount.addSysMail(mid);
        }
        else if (type == MAIL_TYPE.SPECIFY) {
            CacheAccount.addSpecifyMail(mid, player_list);
        }
        else {
            logger.error(FUNC + "邮件类型不支持:", type);
        }
    }
}

function _addRankMail(mail_info) {
    const FUNC = TAG + "_addRankMail() --- ";

    logger.info(FUNC + "mail_info:");

    if (mail_info) {
        let mid = mail_info.mid;
        let reciever_list = mail_info.reciever_list;

        logger.info(FUNC + "mid:", mid);
        logger.info(FUNC + "reciever_list:", reciever_list);

        CacheAccount.addSpecifyMail(mid, reciever_list);
    }
}
