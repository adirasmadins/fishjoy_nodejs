// 每天执行任务
const SQL_CONFIG = require('../../configs/sql');
const tools = require('../../../../utils/tools');
const REDISKEY = require('../../../../models/index').REDISKEY;
const Retention = require('../../configs/consts/Retention');
const RealTime = require('../../configs/consts/RealTime');

exports.sumUpLastDay = sumUpLastDay;
exports.sumUpSomeDay = sumUpSomeDay;
exports.resetCikDailyLeft = resetCikDailyLeft;
exports.getMaxOnlineLastDay = getMaxOnlineLastDay;

/**
 * 计算头一天的最大并发
 */
async function getMaxOnlineLastDay() {
    // let lastDate = tools.DateUtil.getDateBefore(1);
    // let dateB = tools.DateUtil.format(lastDate, tools.DateUtil.FMT.DB);
    // let date = tools.DateUtil.format(lastDate, tools.DateUtil.FMT.D);
    let dateB = tools.DateUtil.format(new Date(), tools.DateUtil.FMT.DB);
    let date = tools.DateUtil.format(new Date(), tools.DateUtil.FMT.D);

    for (let key in RealTime.DATA_MAP) {
        let redisKey = RealTime.DATA_MAP[key];
        // logger.error(`dateB:\n`, dateB);
        let ret = await tools.RedisUtil.hgetall(`${redisKey}:${dateB}`);
        // logger.error(`ret:\n`, ret);

        // 获取最大值对象
        const maxValue = tools.ObjUtil.max(ret);
        let value = {
            time: maxValue.key,
            value: maxValue.value,
        };
        value = JSON.stringify(value);
        // logger.error(`redis op:\n`, `hset ${redisKey}:max date ${value}`);
        await tools.RedisUtil.hset(`${redisKey}:max`, date, value);

        // 获取平均值
        const avgValue = tools.ObjUtil.avg(ret);
        // logger.error(`${key}-avgValue:\n`, avgValue);
        // logger.error(`${key}-redisKey:\n`, `${redisKey}:avg`);
        await tools.RedisUtil.hset(`${redisKey}:avg`, date, avgValue);

        // Redis查询
        // hgetall pair:realtime:fight_server_player_count:max
    }
}

/**
 * 每天产生统计数据(昨天的数据)
 */
async function sumUpLastDay() {
    try {
        let timeBeforeOneDay = tools.DateUtil.getDateBefore(1);
        logger.error('timeBeforeOneDay:', timeBeforeOneDay);
        let log_date = tools.DateUtil.format(timeBeforeOneDay, tools.DateUtil.FMT.D);
        logger.error('1.log_date:', log_date);
        await sumUpSomeDay(log_date, 0, true);

        // yxl_20180408_01
        let newDevice = await tools.RedisUtil.scard(REDISKEY.NEW_DEVICE_1_DAY) || 0;
        tools.RedisUtil.del(REDISKEY.NEW_DEVICE_1_DAY);
        logger.info(`[${log_date}]新增设备数:${newDevice}`);
        await tools.SqlUtil.query(upSql('newDevice'), [newDevice, log_date]);

        // yxl_20180408_01
        let activeDevice = await tools.RedisUtil.scard(REDISKEY.ACTIVE_DEVICE_1_DAY) || 0;
        tools.RedisUtil.del(REDISKEY.ACTIVE_DEVICE_1_DAY);
        logger.info(`[${log_date}]活跃设备数:${activeDevice}`);
        await tools.SqlUtil.query(upSql('activeDevice'), [activeDevice, log_date]);

        let timeBeforeTwoDay = tools.DateUtil.getDateBefore(2);
        log_date = tools.DateUtil.format(timeBeforeTwoDay, tools.DateUtil.FMT.D);
        logger.error('2.log_date:', log_date);
        await sumUpSomeDay(log_date, 1);

        let timeBeforeThreeDay = tools.DateUtil.getDateBefore(3);
        log_date = tools.DateUtil.format(timeBeforeThreeDay, tools.DateUtil.FMT.D);
        logger.error('3.log_date:', log_date);
        await sumUpSomeDay(log_date, 2);

        let timeBeforeSevenDay = tools.DateUtil.getDateBefore(7);
        log_date = tools.DateUtil.format(timeBeforeSevenDay, tools.DateUtil.FMT.D);
        logger.error('4.log_date:', log_date);
        await sumUpSomeDay(log_date, 3);

        let timeBefore14Day = tools.DateUtil.getDateBefore(14);
        log_date = tools.DateUtil.format(timeBefore14Day, tools.DateUtil.FMT.D);
        logger.error('4.log_date:', log_date);
        await sumUpSomeDay(log_date, 4);

        let timeBefore30Day = tools.DateUtil.getDateBefore(30);
        log_date = tools.DateUtil.format(timeBefore30Day, tools.DateUtil.FMT.D);
        logger.error('4.log_date:', log_date);
        await sumUpSomeDay(log_date, 5);

        await resetCikDailyLeft();

    } catch (err) {
        logger.error('err:', err);
    }
}

async function resetCikDailyLeft() {

    try {
        // 每日重置实物兑换中的库存
        let cikLeftData = tools.CfgUtil.change.getLeftData();
        let dailyLeftRecord = await tools.RedisUtil.hgetall(REDISKEY.CIK_DAILY_LEFT);
        let totalLeftRecord = await tools.RedisUtil.hgetall(REDISKEY.CIK_TOTAL_LEFT);

        data = [];
        for (let cid in cikLeftData) {
            let cfgDailyLeft = cikLeftData[cid].dailyLeft;
            let cfgTotalLeft = cikLeftData[cid].totalLeft;
            let redisDailyLeft = getMaxNumber(dailyLeftRecord[cid]);
            let redisTotalLeft = getMaxNumber(totalLeftRecord[cid]);

            let dailyLeft = Math.max(cfgDailyLeft, redisDailyLeft);

            let targetDailyLeft = tools.MathUtil.min([cfgTotalLeft, redisTotalLeft, dailyLeft]);
            data.push(['hset', REDISKEY.CIK_DAILY_LEFT, cid, targetDailyLeft]);
        }
        await tools.RedisUtil.multi(data);
    } catch (err) {
        logger.error('resetCikDailyLeft err', err);
    }

}

function getMaxNumber(input) {
    if (null != input && undefined != input) {
        return Number(input);
    } else {
        return 10000000;
    }
}

/**
 * 产生指定日期的数据
 * @param {*} log_date 产生的数据日期
 * @param {*} retentionLevel 留存数据等级(0,1,2,3,4,5)(0表示不产生留存数据)
 * @param {*} needNormal 是否需要产生常规数据
 */
async function sumUpSomeDay(log_date, retentionLevel = 0, needNormal = false) {
    try {
        logger.error('sumUpSomeDay');
        let dailyData = await tools.SqlUtil.query(SQL_CONFIG.getDailyData, [log_date, log_date]);
        // logger.error('dailyData:', dailyData);
        // 没有想要的数据, 就插入一条记录
        if (!dailyData || 0 == dailyData.length) {
            let fields = [log_date];
            await tools.SqlUtil.query(SQL_CONFIG.insertDailyData, fields);
        }

        let info = {};

        // 制作数据----
        if (needNormal) {
            // 充值统计
            info = await genTopupData(log_date);

            // 提现统计
            await genCashData(log_date, info);

            // 活跃统计
            let key = `${REDISKEY.BIT_DAILY_ACTIVE_USERS}${log_date}`;
            info.active_count = await tools.RedisUtil.bitcount(key);
            await tools.SqlUtil.query(upSql('active_count'), [info.active_count, log_date]);

            // 登录次数统计
            info.login_count = await tools.RedisUtil.hget(REDISKEY.DATE_LOGIN_COUNT, log_date) || 0;
            await tools.SqlUtil.query(upSql('login_count'), [info.login_count, log_date]);

            // shop_pta(付费率), shop_arpu(), shop_arrpu()
            info.shop_pta = (info.shop_account_count / tools.MathUtil.getDenominator(info.active_count)).toFixed(4);
            if (tools.BuzzUtil.isVersionChina()) {
                info.shop_arpu = (info.shop_tpa / 100 / tools.MathUtil.getDenominator(info.active_count)).toFixed(2);
                info.shop_arrpu = (info.shop_tpa / 100 / tools.MathUtil.getDenominator(info.shop_account_count)).toFixed(2);
            } else {
                info.shop_arpu = Math.round(info.shop_tpa / tools.MathUtil.getDenominator(info.active_count));
                info.shop_arrpu = Math.round(info.shop_tpa / tools.MathUtil.getDenominator(info.shop_account_count));
            }

            await tools.SqlUtil.query(upSql('shop_pta'), [info.shop_pta, log_date]);
            await tools.SqlUtil.query(upSql('shop_arpu'), [info.shop_arpu, log_date]);
            await tools.SqlUtil.query(upSql('shop_arrpu'), [info.shop_arrpu, log_date]);

            await makeOnlineData(log_date);
        }

        // 新增用户统计
        let key1 = `${REDISKEY.BIT_DAILY_NEW_USERS}${log_date}`;
        info.new_account = await tools.RedisUtil.bitcount(key1);
        await tools.SqlUtil.query(upSql('new_account'), [info.new_account, log_date]);

        // 留存统计
        for (let i = 0; i < Retention.length; i++) {
            if (i >= retentionLevel) {
                break;
            }
            await genRetention(Retention[i], log_date, key1, info.new_account);
        }

    } catch (err) {
        logger.error('err:', err);
    }
}

async function makeOnlineData(date) {
    let result = await tools.SqlUtil.query(SQL_CONFIG.realData, tools.ObjUtil.makeSqlDataFromTo(date, date));
    let avgHourOnline = 0;
    let maxHourOnline = 0;
    for (let i = 0; i < result.length; i++) {
        let hourData = result[i];
        if (hourData.online_count > maxHourOnline) {
            maxHourOnline = hourData.online_count;
        }
        avgHourOnline += hourData.online_count;
    }
    avgHourOnline /= 24;
    await tools.SqlUtil.query(upSql('avgHourOnline'), [avgHourOnline, date]);
    await tools.SqlUtil.query(upSql('maxHourOnline'), [maxHourOnline, date]);
}

async function genTopupData(date) {
    let result = await tools.SqlUtil.query(SQL_CONFIG.getTopupData, tools.ObjUtil.makeSqlDataFromTo(date, date));
    logger.error('result:', result);
    let info = result[0];
    if (tools.BuzzUtil.isVersionChina()) {
        info.shop_tpa *= 10;
    }
    await tools.SqlUtil.query(upSql('shop_time_count'), [info.shop_time_count, date]);
    await tools.SqlUtil.query(upSql('shop_account_count'), [info.shop_account_count, date]);
    await tools.SqlUtil.query(upSql('shop_tpa'), [info.shop_tpa, date]);

    info.pafft = getPafft(date);
    info.paffd = getPaffd(date);

    return info;
}

/**
 * 首次付费玩家 ( Pay Account For the First Time )
 */
async function getPafft(date) {
    let result = await tools.SqlUtil.query(SQL_CONFIG.getPafft, tools.ObjUtil.makeSqlDataFromTo(date, date));
    logger.error('result:', result);
    let info = result[0];
    await tools.SqlUtil.query(upSql('shop_pafft'), [info.sum, date]);
    return info.sum;
}

/**
 * 首日付费玩家 ( Pay Account For the First Day )
 */
async function getPaffd(date) {
    let result = await tools.SqlUtil.query(SQL_CONFIG.getPaffd, [date, date]);
    logger.error('result:', result);
    let info = result[0];
    await tools.SqlUtil.query(upSql('shop_paffd'), [info.sum, date]);
    return info.sum;
}

async function genCashData(date, info) {
    info.cash_count = 0;
    info.cash_account = 0;
    info.cash_vnd_sum = 0;
    info.cash_vnd_avg = 0;

    // TODO: 通过tbl_change_log中status为2的数据进行统计
    let fields = tools.ObjUtil.makeSqlDataFromTo(date, date);
    info.cash_count = (await tools.SqlUtil.query(SQL_CONFIG.getCashCount, fields))[0].sum;
    info.cash_account = (await tools.SqlUtil.query(SQL_CONFIG.getCashAccount, fields))[0].sum;
    info.cash_vnd_sum = (await tools.SqlUtil.query(SQL_CONFIG.getCashSum, fields))[0].sum;
    info.cash_vnd_avg = Math.round(info.cash_vnd_sum / tools.MathUtil.getDenominator(info.cash_account));

    if (tools.BuzzUtil.isVersionVietnam()) {
        info.cash_vnd_sum /= 3.75;
        info.cash_vnd_avg /= 3.75;
    } else if (tools.BuzzUtil.isVersionChina()) {
        info.cash_vnd_sum /= 100;
        info.cash_vnd_avg /= 100;
    }

    await tools.SqlUtil.query(upSql('cash_count'), [info.cash_count, date]);
    await tools.SqlUtil.query(upSql('cash_account'), [info.cash_account, date]);
    await tools.SqlUtil.query(upSql('cash_vnd_sum'), [info.cash_vnd_sum, date]);
    await tools.SqlUtil.query(upSql('cash_vnd_avg'), [info.cash_vnd_avg, date]);
}

/**
 * 产生留存数据.
 * @param {*} data 
 * @param {*} log_date 
 * @param {*} key1 
 * @param {*} registerCount 
 */
async function genRetention(data, log_date, key1, registerCount) {
    let dayAfter = getDateAfter(log_date, data.dayAfter);
    let key2 = `${REDISKEY.BIT_DAILY_ACTIVE_USERS}${dayAfter}`;
    logger.error('key2:', key2);
    await tools.RedisUtil.bitop('AND', 'temp', key1, key2);
    let remainCount = await tools.RedisUtil.bitcount('temp');
    // logger.error('remainCount:', remainCount);
    let r = remainCount / tools.MathUtil.getDenominator(registerCount);
    // logger.error('r:', r);
    await tools.SqlUtil.query(upSql(data.mysqlField), [r, log_date]);
}

/**
 * 获取指定日期date往后dayCount天的日期, 以'YYYY-MM-DD'格式显示
 * @param {*} date 
 * @param {*} dayCount 
 */
function getDateAfter(date, dayCount) {
    return tools.DateUtil.format(tools.DateUtil.getDateAfterFrom(date, dayCount), tools.DateUtil.FMT.D);
}

/**
 * 更新域值的SQL语句
 * @param {*} field 
 */
function upSql(field) {
    return SQL_CONFIG.updateDailyData.replace('|field|', field);
}