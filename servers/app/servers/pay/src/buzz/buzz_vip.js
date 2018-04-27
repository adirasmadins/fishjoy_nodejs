const RedisUtil = require('../utils/RedisUtil');
const CacheAccount = require('./cache/CacheAccount');
const vip_vip_cfg = require('../../../../utils/imports').DESIGN_CFG.vip_vip_cfg;
const tools = require('../../../../utils/tools');

//==============================================================================
// const
//==============================================================================
let DEBUG = 0;
let ERROR = 1;

let TAG = "【buzz_weapon】";

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

    let token = dataObj.token;
    let uid = dataObj.uid;
    let diamond = dataObj.diamond;
    let pool = req.pool;

    doNextWithAccount(dataObj.account);

    function doNextWithAccount(account) {

        let prev_vip = account.vip;
        let prev_rmb = account.rmb;

        let curr_rmb = prev_rmb + diamond * 10;//1钻等于10分
        let curr_vip = prev_vip;
        for (let key in vip_vip_cfg) {
            let value = vip_vip_cfg[key];
            let times = tools.BuzzUtil.getRmbTimes();// 区分倍率
            if (value.vip_unlock * times <= curr_rmb) {
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
