////////////////////////////////////////////////////////////////////////////////
// Account Update Guide
// 新手引导完成状态
// update
////////////////////////////////////////////////////////////////////////////////
let CacheAccount = require('../../../buzz/cache/CacheAccount');

const GUIDE_DONE_WP = 5;

/**
 * 账户数据更新(每日任务完成度).
 * 只更新弱引导；强制引导以领取教学奖励为标记。
 */
exports.update = function (data, cb, account) {
    let ret = {};
    if (account.guide) {
        account.guide_weak = data.weak;
        account.commit();
    }
    cb(null, [ret]);
};