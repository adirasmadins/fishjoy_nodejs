const _ = require('underscore');
const CommonUtil = require('./CommonUtil');
const ObjUtil = require('./ObjUtil');
const ArrayUtil = require('../utils/ArrayUtil');
const CstError = require('../../../../consts/fish_error');
const RedisUtil = require('../utils/RedisUtil');
const BuzzUtil = require('../utils/BuzzUtil');
const redisKeys = require('../../../../database').dbConsts.REDISKEY;
const CacheAccount = require('./cache/CacheAccount');
const ERROR_OBJ = CstError.ERROR_OBJ;


const TAG = "【buzz_friends】";

exports.addFriend = addFriend;
exports.delFriend = delFriend;

function addFriend(dataObj, cb) {
    if (!lPrepare(dataObj)) return;

    _addFriend(dataObj, cb);

    function lPrepare(input) {
        return BuzzUtil.checkParams(input, ['token', 'type', 'id'], "buzz_friends", cb);
    }
}

/**
 * 使用有序集合处理
 * @param dataObj
 * @param cb
 * @private
 */
async function _addFriend(dataObj, cb) {
    const FUNC = TAG + "_addFriend() --- ";
    logger.info(FUNC + "dataObj:", dataObj);
    let id = +dataObj.id;
    let uid = +dataObj.token.split("_")[0];
    RedisUtil.zrem(`${redisKeys.MSG.ASK_FRIEND}:${uid}`, id);
    //拒绝添加好友
    if (dataObj.type == 1) {
        cb(null, "success");
        return;
    }
    try {
        let account = await CacheAccount.getAccountFieldByIdSync(uid, ['game_friend', "vip"]);
        let faccount = await CacheAccount.getAccountFieldByIdSync(id, ['game_friend', "vip"]);
        let gameFriend = account.game_friend;
        let vip = account.vip;
        let fgameFriend = faccount.game_friend;
        let fvip = faccount.vip;
        //临时处理
        for (let i = 0; i < gameFriend.length; i++) {
            gameFriend[i] = +gameFriend[i];
        }
        for (let i = 0; i < fgameFriend.length; i++) {
            fgameFriend[i] = +fgameFriend[i];
        }
        if (gameFriend.indexOf(id) !== -1 || fgameFriend.indexOf(uid) !== -1) {
            cb && cb(ERROR_OBJ.CHAT_FRIEND_ALREADY_ERROR);
        } else if (BuzzUtil.getMaxFriendNum(vip) <= gameFriend.length) {
            cb && cb(ERROR_OBJ.CHAT_ERROR_FRIEND_LIMIT_ME);
        } else if (BuzzUtil.getMaxFriendNum(fvip) <= fgameFriend.length) {
            cb && cb(ERROR_OBJ.CHAT_ERROR_FRIEND_LIMIT_TARGET);
        } else {
            gameFriend.push(id);
            fgameFriend.push(uid);
            account.game_friend = gameFriend;
            faccount.game_friend = fgameFriend;
            CacheAccount.setCharmPointWithFriendChange(id);
            CacheAccount.setCharmPointWithFriendChange(uid);
            account.commit();
            faccount.commit();
            cb(null, "success");
        }
    } catch (err) {
        logger.error("添加好友失败");
        cb(err);
    }
}

function delFriend(dataObj, cb) {
    const FUNC = TAG + "delFriend() --- ";
    if (!lPrepare(dataObj)) return;
    //BuzzUtil.cacheLinkDataApi(dataObj, "addFriend");

    _delFriend(dataObj, cb);

    function lPrepare(input) {
        return BuzzUtil.checkParams(input, ['token', 'id'], "buzz_friends", cb);
    }
}

async function _delFriend(dataObj, cb) {
    const FUNC = TAG + "_delFriend() --- ";
    logger.info(FUNC + "CALL...");
    let id = +dataObj.id;
    let uid = +dataObj.token.split("_")[0];
    try {
        let account = await CacheAccount.getAccountFieldByIdSync(uid, ['game_friend']);
        let gameFriend = account.game_friend;
        for (let i = 0; i < gameFriend.length; i++) {
            gameFriend[i] = +gameFriend[i];
            if (gameFriend[i] === id) {
                gameFriend.splice(i, 1);
            }
        }
        account.game_friend = gameFriend;
        account.commit();
        cb(null, account.game_friend);
        CacheAccount.setCharmPointWithFriendChange(uid);
        try {
            let faccount = await CacheAccount.getAccountFieldByIdSync(id, ['game_friend']);
            let fgameFriend = faccount.game_friend;
            for (let i = 0; i < fgameFriend.length; i++) {
                fgameFriend[i] = +fgameFriend[i];
                if (fgameFriend[i] === uid) {
                    fgameFriend.splice(i, 1);
                }
            }
            faccount.game_friend = fgameFriend;
            faccount.commit();
            CacheAccount.setCharmPointWithFriendChange(id);
        } catch (err) {
            //do nothing
        }
    } catch (err) {
        logger.error("删除好友失败");
        cb(err);
    }
}