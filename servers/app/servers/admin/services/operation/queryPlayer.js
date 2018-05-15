const SQL_CONFIG = require('../../configs/sql');
const tools = require('../../../../utils/tools');
const DESIGN_CFG = require('../../../../utils/imports').DESIGN_CFG;
const REDISKEY = require('../../../../database').dbConsts.REDISKEY;

const SCENE = DESIGN_CFG.common_log_const_cfg;

const GAIN_SCENE = [SCENE.GAME_FIGHTING, SCENE.NUCLER_DROP, SCENE.NUCLER_LASER, SCENE.GOLDFISH_GAIN];
const COST_SCENE = [SCENE.GAME_FIGHTING, SCENE.NUCLER_COST];

/**
 * 获取玩家数据
 * @param {*} data {uid:123}
 */
exports.get = async function (data, ctx) {
    console.log('data:', data);
    try {
        let uidOrNickname = data.uid;
        let account = await getAccountByUidOrNickname(uidOrNickname);
        let ret = await fetchData(account);
        console.log('ret:', ret);

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

async function fetchData(account) {
    let uid = account.id;
    let nickname = account.nickname;
    let recharge = await tools.RedisUtil.hget(REDISKEY.RECHARGE, uid) || 0;
    let cash = await tools.RedisUtil.hget(REDISKEY.CASH, uid) || 0;
    let gold = await tools.RedisUtil.hget(REDISKEY.GOLD, uid) || 0;
    let catchRate = await tools.RedisUtil.hget(REDISKEY.PLAYER_CATCH_RATE, uid) || 1;

    let credit = Math.max((recharge * 3 - cash * DESIGN_CFG.common_const_cfg.CHANGE_CASH_4), 100000);
    let profit = Math.round(parseInt(cash) + parseInt(gold) / DESIGN_CFG.common_const_cfg.CHANGE_CASH_4 - parseInt(recharge));

    let fireRecentHour = (await tools.SqlUtil.query(SQL_CONFIG.getFire1HourPlayer, [uid]))[0].sum || 0;

    let gainRecentHour = await BuzzUtil.getGain1HourFishingPlayer(uid);
    let costRecentHour = await BuzzUtil.getCost1HourFishingPlayer(uid);
    let profitRecentHour = gainRecentHour - costRecentHour;
    let profitRateRecentHour = profitRecentHour / tools.MathUtil.getDenominator(costRecentHour);
    profitRateRecentHour = tools.MathUtil.makePercent(profitRateRecentHour);

    // TODO: 需要新的数据来记录(累加)
    // profitHistory = ?;
    // profitRateHistory = ?;
    // catchRateExpire = ?;

    return {
        nickname: nickname,
        uid: uid,
        recharge: recharge,
        cash: cash,
        credit: credit,
        gold: gold,
        profit: profit,
        catchRate: catchRate,
        fireRecentHour: fireRecentHour,
        profitRecentHour: profitRecentHour,
        profitRateRecentHour: profitRateRecentHour,
        profitHistory: 'TODO',
        profitRateHistory: 'TODO',
        catchRateExpire: 'TODO'
    };
}

async function getAccountByUidOrNickname(uidOrNickname) {
    let results = await tools.SqlUtil.query(SQL_CONFIG.getAccountByUidOrNickname, [uidOrNickname, uidOrNickname]);
    if (results && results.length > 0) {
        return results[0];
    }
    else {
        let errMsg = `没有查找到用户:${uidOrNickname}`;
        logger.error(errMsg);
        throw new Error(errMsg);
    }
}

// let fake1 = {
//     nickname: 'Zhang San',
//     uid: 123,
//     recharge: 300000,
//     cash: 20000,
//     credit: 100000,
//     gold: 30000,
//     profit: 50000,
//     catchRate: 1,
//     fireRecentHour: 1000,
//     profitRecentHour: 300,
//     profitRateRecentHour: 0.03,

//     profitHistory: 2000,
//     profitRateHistory: -0.01,

//     catchRateExpire: 300
// };