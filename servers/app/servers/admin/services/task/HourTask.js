// 每小时执行任务
const SQL_CONFIG = require('../../configs/sql');
const tools = require('../../../../utils/tools');
const REDISKEY = require('../../../../models/index').REDISKEY;

exports.sumUpLastHour = sumUpLastHour;

/**
 * 每小时产生统计数据(上一小时的数据)
 */
async function sumUpLastHour() {
    try {
        let start_time = tools.DateUtil.getLastHourStart();
        let end_time = tools.DateUtil.getLastHourEnd();

        let new_account = (await tools.SqlUtil.query(SQL_CONFIG.getLastHourNewAccount, [start_time, end_time]))[0].sum || 0;
        let login_count = (await tools.SqlUtil.query(SQL_CONFIG.getLastHourLoginTimes, [start_time, end_time]))[0].sum || 0;
        let account_count = (await tools.SqlUtil.query(SQL_CONFIG.getLastHourLoginAccount, [start_time, end_time]))[0].sum || 0;

        let onlineCount = await tools.RedisUtil.scard(REDISKEY.ONLINE_UID_1_HOUR) || 0;
        tools.RedisUtil.del(REDISKEY.ONLINE_UID_1_HOUR);

        // yxl_20180408_01
        let newDevice = await tools.RedisUtil.scard(REDISKEY.NEW_DEVICE_1_HOUR) || 0;
        tools.RedisUtil.del(REDISKEY.NEW_DEVICE_1_HOUR);
        logger.info(`上一个小时新增设备数:${newDevice}`);

        // yxl_20180408_01
        let activeDevice = await tools.RedisUtil.scard(REDISKEY.ACTIVE_DEVICE_1_HOUR) || 0;
        tools.RedisUtil.del(REDISKEY.ACTIVE_DEVICE_1_HOUR);
        logger.info(`上一个小时活跃设备数:${activeDevice}`);

        let fields = [
            start_time,
            new_account,
            login_count,
            account_count,
            activeDevice,
            newDevice,
            onlineCount,
        ];
        for (let i = 1; i <= 6; i++) {
            fields.push(await tools.RedisUtil.hget(REDISKEY.PAIR_IDX_ONLINE_COUNT, i) || 0);
        }
        await tools.SqlUtil.query(SQL_CONFIG.insertHourData, fields);
    } catch (err) {
        logger.error('err:', err);
    }
}