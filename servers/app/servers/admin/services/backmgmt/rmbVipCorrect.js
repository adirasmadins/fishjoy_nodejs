const tools = require('../../../../utils/tools');
const SQL_CONFIG = require('../../configs/sql');
const REDISKEY = require('../../../../models/index').REDISKEY;

/**
 * 批量纠正玩家VIP和RMB数据
 * @param {*} data { uidList: [123,234,345] }
 */
exports.excute = async function (data, ctx) {
    logger.info('data:', data);
    try {
        await fix(data.uidList);

        return {
            result: true
        };
    } catch (err) {
        logger.error('修改服务器开关错误:', err);
        return {
            result: false,
            err: err
        };
    }
};

async function fix(uidList) {
    for (let i in uidList) {
        let uid = uidList[i];
        let sql = SQL_CONFIG.getRechargeUser.replace('|uid_list|', uid);
        let ret = await tools.SqlUtil.query(sql, []);
        let rmb = ret[0].sum;
        let vip = tools.CfgUtil.vip.getVipFromRmb(rmb);
        logger.error('uid:', uid);
        logger.error('rmb:', rmb);
        logger.error('vip:', vip);
        await tools.RedisUtil.hset(REDISKEY.RMB, uid, rmb);
        await tools.RedisUtil.hset(REDISKEY.VIP, uid, vip);
        sql = SQL_CONFIG.updateAccount.replace('|field|', 'rmb').replace('|uid_list|', uid);
        await tools.SqlUtil.query(sql, [rmb]);
        sql = SQL_CONFIG.updateAccount.replace('|field|', 'vip').replace('|uid_list|', uid);
        await tools.SqlUtil.query(sql, [vip]);
    }
}