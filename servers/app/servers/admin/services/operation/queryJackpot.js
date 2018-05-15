const SQL_CONFIG = require('../../configs/sql');
const tools = require('../../../../utils/tools');
const DESIGN_CFG = require('../../../../utils/imports').DESIGN_CFG;
const REDISKEY = require('../../../../database').dbConsts.REDISKEY;

const SCENE = DESIGN_CFG.common_log_const_cfg;

const GAIN_SCENE = [SCENE.GAME_FIGHTING, SCENE.NUCLER_DROP, SCENE.NUCLER_LASER, SCENE.GOLDFISH_GAIN];
const COST_SCENE = [SCENE.GAME_FIGHTING, SCENE.NUCLER_COST];

/**
 * 获取奖池数据
 */
exports.get = async function (data, ctx) {

    try {
        let ret = await fetchData();
        logger.error('ret:\n', ret);

        return ret;
    }
    catch (err) {
        logger.error(err);
        return {
            result: false,
            err: err
        };
    }
};

async function fetchData() {

    // let rechargeTotal = await tools.RedisUtil.get(REDISKEY.PLATFORM_DATA.PLATFORM_RECHARGE);
    // TODO: 使用tbl_stat_day进行计算
    let rechargeTotal = (await tools.SqlUtil.query(SQL_CONFIG.rechargeHistory, []))[0].sum || 0;
    // let cashTotal = await tools.RedisUtil.get(REDISKEY.PLATFORM_DATA.PLATFORM_CASH);
    let cashTotal = (await tools.SqlUtil.query(SQL_CONFIG.cashHistory1, []))[0].sum || 0;
    let rechargeRecentWeek = (await tools.SqlUtil.query(SQL_CONFIG.rechargeWeek, []))[0].sum || 0;
    let cashRecentWeek = (await tools.SqlUtil.query(SQL_CONFIG.cashWeek1, []))[0].sum || 0;
    let playerFireRecentHour = (await tools.SqlUtil.query(SQL_CONFIG.getFire1Hour, []))[0].sum || 0;

    let sql = SQL_CONFIG.getGain1HourFishing.replace('|scene|', GAIN_SCENE.toString());
    let gainRecentHour = (await tools.SqlUtil.query(sql, []))[0].sum || 0;

    sql = SQL_CONFIG.getCost1HourFishing.replace('|scene|', COST_SCENE.toString());
    let costRecentHour = (await tools.SqlUtil.query(sql, []))[0].sum || 0;

    let playerProfitRecentHour = gainRecentHour - costRecentHour;
    let playerProfitRateRecentHour = playerProfitRecentHour / (costRecentHour == 0 ? 1 : costRecentHour);

    let serverCatchRate = Number((await tools.RedisUtil.get(REDISKEY.PLATFORM_DATA.PLATFORM_CATCHRATE)) || 1);
    // serverCatchRate = tools.MathUtil.makePercent(serverCatchRate);
    let serverCatchRateExpire = await getServerCatchRateExpireTime();

    let cashRate = Number(await tools.RedisUtil.get(REDISKEY.PLATFORM_DATA.CASH_RECHAREGE_PERCET));
    // cashRate = tools.MathUtil.makePercent(cashRate);
    let cashRateCorrection = 0;//TODO

    return {
        rechargeTotal: rechargeTotal,
        cashTotal: cashTotal,
        rechargeRecentWeek: rechargeRecentWeek,
        cashRecentWeek: cashRecentWeek,
        playerFireRecentHour: playerFireRecentHour,
        playerProfitRecentHour: playerProfitRecentHour,
        playerProfitRateRecentHour: playerProfitRateRecentHour,
        serverCatchRate: serverCatchRate,
        serverCatchRateExpire: serverCatchRateExpire,
        cashRate: cashRate,
        cashRateCorrection: cashRateCorrection
    };
}

async function getServerCatchRateExpireTime() {
    let gpctTimestamp = await tools.RedisUtil.get(REDISKEY.PLATFORM_DATA.G_GPCT_OUT_TIMESTAMP);
    let now = new Date().getTime();
    if (!gpctTimestamp) {
        now = -1;
    } else {
        now -= gpctTimestamp;
        now /= 1000;
        let dt = await tools.RedisUtil.get(REDISKEY.PLATFORM_DATA.G_GPCT_OUT);
        now = dt - now; //剩余时间
    }
    return now;
}



// let fake1 = {
//     rechargeTotal: 9554540000,
//     cashTotal: 450000,
//     rechargeRecentWeek: 556690,
//     cashRecentWeek: 2300,
//     playerFireRecentHour: 20,
//     playerProfitRecentHour: 100,
//     serverCatchRate: 0.97,
//     serverCatchRateExpire: 9856,
//     cashRate: 0.45,
//     cashRateCorrection: 1
// };