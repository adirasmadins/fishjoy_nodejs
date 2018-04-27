////////////////////////////////////////////////////////////////////////////////
// Account Update Guide
// 新手引导完成状态
// update
////////////////////////////////////////////////////////////////////////////////
let CacheAccount = require('../../../buzz/cache/CacheAccount');

const GUIDE_DONE_WP = 5;

/**
 * 账户数据更新(每日任务完成度).
 * 强制引导结束，才有若引导的进行
 */
exports.update = function (data, cb, account) {
    let ret = {};
    if (!account.guide) {
        account.guide = data.guide ? 1 : 0;
        CacheAccount.setWeapon(account, GUIDE_DONE_WP, function (chs) {
            if (chs && chs.length == 2) {
                let charmPoint = chs[0];
                let charmRank = chs[1];
                charmPoint >= 0 && (ret.charm_point = charmPoint);
                charmRank >= 0 && (ret.charm_rank = charmRank);
            }
            cb(null, [ret]);
        });
    } else {
        account.guide_weak = data.weak;
        account.commit();
        cb(null, [ret]);
    }
};