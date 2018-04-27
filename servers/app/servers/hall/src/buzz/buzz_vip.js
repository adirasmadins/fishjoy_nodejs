const RedisUtil = require('../utils/RedisUtil');
const DaoCommon = require('../dao/dao_common');
const CacheAccount = require('./cache/CacheAccount');
const vip_vip_cfg = require('../../../../utils/imports').DESIGN_CFG.vip_vip_cfg;

//==============================================================================
// const
//==============================================================================
var DEBUG = 0;
var ERROR = 1;

var TAG = "【buzz_weapon】";

//==============================================================================
// public
//==============================================================================

//------------------------------------------------------------------------------
// definition
//------------------------------------------------------------------------------
exports.updateRmbAndVip = updateRmbAndVip;

//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------

/**
 * 更新人民币和VIP
 */
function updateRmbAndVip(req, dataObj) {
    const FUNC = TAG + "updateRmbAndVip() --- ";
    //----------------------------------
    _updateRmbAndVip(req, dataObj);
}


//==============================================================================
// private
//==============================================================================

/**
 * 更新人民币和VIP
 */
function _updateRmbAndVip(req, dataObj, cb) {
    const FUNC = TAG + "_updateRmbAndVip() --- ";
    const EFUNC = "<<<ERROR>>>" + TAG + "_updateRmbAndVip() --- ";

    var token = dataObj.token;
    var uid = dataObj.uid;
    var diamond = dataObj.diamond;
    var pool = req.pool;

    DaoCommon.checkAccount(pool, token, function(error, account) {
        if (error) {
            cb && cb(error);
            return;
        }
        doNextWithAccount(account);
    });

    function doNextWithAccount(account) {

        var prev_vip = account.vip;
        var prev_rmb = account.rmb;

        var curr_rmb = prev_rmb + diamond * 10;//1钻等于10分
        var curr_vip = prev_vip;
        for (let key in vip_vip_cfg) {
            var value = vip_vip_cfg[key];
            if (value.vip_unlock * 100 <= curr_rmb) {
                curr_vip = value.vip_level;
            }
        }
        if (DEBUG) logger.info("-------------------------------------");
        if (DEBUG) logger.info(FUNC + "curr_vip: " + curr_vip);

        // 玩家VIP变化时重置vip_daily_reward
        if (curr_vip > prev_vip) {
            RedisUtil.hset("pair:uid:vip_daily_reward", uid, 0);
        }

        CacheAccount.setRmb(uid, curr_rmb);
        CacheAccount.setVip(uid, curr_vip);
    }
}
