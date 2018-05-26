const BuzzUtil = require('../utils/BuzzUtil');
const RedisUtil = require('../utils/RedisUtil');
const ERROR_OBJ = require('../../../../consts/fish_error').ERROR_OBJ;
const CacheAccount = require('./cache/CacheAccount');
const redisKeys = require('../../../../database').dbConsts.REDISKEY;


const TAG = "【buzz_account】";
exports.banUser = banUser;

/**
 * 对玩家施行封号操作
 */
function banUser(dataObj, cb) {
    const FUNC = TAG + "banUser() --- ";

    if (!lPrepare(dataObj)) return;
    let admin_account=dataObj.account;
    let uid=dataObj.uid;
    let uid_list = dataObj.uid_list;
    let isAdmin = admin_account.msgboard_mgmt;
    if (!isAdmin) {
        admin_account.test = -1;
        admin_account.commit();
        _removeRank([uid]);
        logger.error(FUNC + "玩家" + uid + "被封号, 原因: 不是管理员调用封号接口");
        cb && cb(ERROR_OBJ.PLAYER_CHEAT);
        let nickname = admin_account.nickname;
        logBanUser(uid, nickname, uid_list, "fail, reason: not an admin");
    }else {
        _banUser(dataObj, cb);
    }

    function lPrepare(input) {
        return BuzzUtil.checkParams(input, ['token', 'uid_list'], "buzz_account.banUser", cb);
    }

}

function logBanUser(admin_uid, nickname, uid_list, comment) {
    const FUNC = TAG + "logBanUser() --- ";

    let value = {
        admin_uid: admin_uid,
        nickname: nickname,
        uid_list: uid_list,
        comment: comment,
        timestamp: new Date().getTime(),
    };
    value = JSON.stringify(value);
    RedisUtil.rpush(redisKeys.LOG.BAN_USER, value, function (err, res) {
        if (err) {
            logger.error(FUNC + "Redis设置失败, err:", err);
        }
        else {
            logger.info(FUNC + "Redis设置成功, res:", res);
        }
    });
}

function _removeRank(uids) {
    let rank_key = {
        GOLD: "rank:gold",
        ACHIEVE: "rank:achieve",
        GODDESS: "rank:goddess",
        MATCH: "rank:match",
        AQUARIUM: "rank:aquarium",
        CHARM: "rank:charm",
        BP: "rank:bp",
        FLOWER: "rank:flower",
    };
    for(let key in rank_key){
        _delPlayerRankData(`${rank_key[key]}:1`, uids);
        _delPlayerRankData(`${rank_key[key]}:2`, uids);
    }
}

function _delPlayerRankData(key, uids){
    RedisUtil.zrem(key, uids, function(err, result){
        logger.info('-------------------', result);
        if(err){
            logger.error('清空玩家排行榜信息失败');
            return;
        }
        logger.info('移除玩家排行信息ok,玩家列表:', uids, '排行类型:', key);
    });
}

function _banUser(dataObj, cb) {
    const FUNC = TAG + "_banUser() --- ";
    let admin_uid = dataObj.uid;
    let account = dataObj.account;
    let uid_list = dataObj.uid_list;
    uid_list = uid_list.split(',');

    if (uid_list.length > 0) {
        for (let i = 0; i < uid_list.length; i++) {
            CacheAccount.setTest(uid_list[i], -1);
        }
        // 删除排行榜
        _removeRank(uid_list);
        logger.info(FUNC + "如下玩家被封号:", uid_list);
        cb && cb(null, "success");
        let nickname = account.nickname;
        logBanUser(admin_uid, nickname, uid_list, "success");
    }
    else {
        logger.info(FUNC + "do nothing...");
        cb && cb(ERROR_OBJ.PARAM_MISSING);
    }
}