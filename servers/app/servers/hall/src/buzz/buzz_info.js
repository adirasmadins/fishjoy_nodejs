const BuzzUtil = require('../utils/BuzzUtil');
const RedisUtil = require('../utils/RedisUtil');
const redisKeys = require('../../../../database').dbConsts.REDISKEY;
const ItemTypeC = require('./pojo/Item').ItemTypeC;
const buzz_limit_items = require('../buzz/buzz_limit_items');
const ERROR_OBJ = require('../../../../consts/fish_error').ERROR_OBJ;

exports.getHuafeiquan = getHuafeiquan;

/**
 * 获取限时道具领取时间戳
 */
exports.getItemLimitGotTime = function (dataObj, cb) {
    buzz_limit_items.checkItemLimitEnd(dataObj.account, function (res) {
        if (!res) {
            cb && cb(ERROR_OBJ.NO_LIMIT_ITEM);
        } else {
            cb && cb(null, res);
        }
    });
};

/**
 * 获取指定限时道具剩余时长
 */
exports.getItemLimitTime = function (dataObj, cb) {
    let itemId = dataObj.itemId;
    let gotAt = dataObj.gotAt;
    let account = dataObj.account;
    let id = account.id;
    if (id) {
        buzz_limit_items.getLimitLeft(id, itemId, gotAt, function (left) {
            if (left == -1) {
                cb && cb(ERROR_OBJ.NOT_LIMIT_ITEM);
            } else if (left == -2) {
                cb && cb(ERROR_OBJ.WRONG_TIMESTAMP);
            } else if (left == -3) {
                cb && cb(ERROR_OBJ.ITEM_NOT_EXIST);
            } else {
                cb && cb(null, {itemId: itemId, ltime: left});
            }
        });
    } else {
        cb && cb(ERROR_OBJ.ACCOUNT_CHECK_ERROR);
    }
};

/**
 * 获取喇叭使用个数、收到鲜花数量
 */
exports.getHornFlower = function (dataObj, cb) {
    let account = dataObj.account;
    let id = account.id;
    if (id) {
        let flowerC = 0;
        let hornC = 0;
        let tmp = [
            ['hget', redisKeys.FLOWER_RECEIVE, id],
            ['hget', redisKeys.HORN_USED, id],
        ];
        RedisUtil.multi(tmp, function (err, ret) {
            if (ret && ret.length == tmp.length) {
                flowerC = parseInt(ret[0]) || 0;
                hornC = parseInt(ret[1]) || 0;
                cb && cb(null, {hornC: hornC, flowerC: flowerC});
            } else {
                cb(err);
            }
        });
    } else {
        cb(null);
    }
};

/**
 * 获取话费券数量.
 */
function getHuafeiquan(dataObj, cb) {
    if (!lPrepare(dataObj)) return;

    let account = dataObj.account;
    let num = getHuafeiquanFromPack(account.package);
    logger.info("getHuafeiquan num:", num);
    cb(null, {change: {package: {"9": {"i003": num}}}});

    function lPrepare(input) {
        return BuzzUtil.checkParams(input, ['token'], "buzz_info", cb);
    }
}

function getHuafeiquanFromPack(pack) {
    if ("undefined" == typeof(pack[ItemTypeC.TOKENS])) {
        pack[ItemTypeC.TOKENS] = {};
    }
    if ("undefined" == typeof(pack[ItemTypeC.TOKENS]["i003"])) {
        pack[ItemTypeC.TOKENS]["i003"] = 0;
    }
    return pack[ItemTypeC.TOKENS]["i003"];
}
