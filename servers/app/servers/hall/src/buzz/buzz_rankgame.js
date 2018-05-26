const CommonUtil = require('./CommonUtil');
const RANK_TYPE = require('../rankCache/cacheConf').RANK_TYPE;
const _ = require('underscore');
const dao_rankgame = require('../dao/dao_rankgame');
const cache = require('../rankCache/cache');


const TAG = "【buzz_rankgame】";

exports.result = result;
exports.info = info;
exports.box = box;

//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------

/**
 * 获取排位赛结果
 */
function result(data, cb) {
    dao_rankgame.getRankgame(data, cb);
}

/**
 * 获取排位赛信息
 */
function info(data, cb) {
    let account=data.account;
    let uid=data.uid;
    dao_rankgame.rankgameInfo(account, function (err, ret) {
        if (err) return cb && cb(err);
        // DONE: 使用Redis中生成的排行榜获取玩家的排位赛数据.
        let my_rank_info = cache.getRank(account.platform, RANK_TYPE.MATCH, uid);
        ret.my_rank = my_rank_info.my_rank;
        // 不仅获取玩家的名次，也要获取玩家的胜点和段位数据.
        // 如果玩家不在排行榜中, 不要覆盖了排行榜的数据
        ret.rank = my_rank_info.rank || account.match_rank;
        ret.points = my_rank_info.points || account.match_points;
        cb && cb(null, ret);
    });

}

/**
 * 排位赛中的宝箱操作相关
 */
function box(data, cb) {
    dao_rankgame.rankgameBox(data, cb);
}

//==============================================================================
// private
//==============================================================================

function _prepare(data, cb) {

    let token = data['token'];

    logger.info("token:", token);

    if (!CommonUtil.isParamExist("buzz_rankgame", token, "接口调用请传参数token", cb)) return false;

    return true;

}