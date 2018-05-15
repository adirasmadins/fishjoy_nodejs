const tools = require('../../../../utils/tools');
const REDISKEY = require('../../../../database').dbConsts.REDISKEY;
const ACCOUNTKEY = require('../../../../database').dbConsts.ACCOUNTKEY;
const redisAccountSync = require('../../../../../app/utils/redisAccountSync');

const PROFIT_TYPE = {
    GAIN: 1,//盈利排行
    LOSS: 2,//亏损排行
};

/**
 * 获取玩家盈利排行榜
 * @param {*} data { start: '1', length: '100', type: '1'|'2' }
 */
exports.get = async function (data, ctx) {
    logger.error('getProfitData - data:', data);

    try {
        let start = (+data.start - 1) * +data.length;
        let length = +data.length;
        let type = +data.type;
        let oriData = await fetchData(start, length, type);
        let chart = await makeChart(oriData);
        return {
            rows: 3,
            pages: 1,
            chart: chart
        };
    }
    catch (err) {
        logger.error('err:', err);
        return {
            result: false,
            err: err
        };
    }
};

async function fetchData(start, length, type) {
    switch (Number(type)) {
        case PROFIT_TYPE.GAIN:
            return await gain(start, length);
        case PROFIT_TYPE.LOSS:
            return await loss(start, length);
        default:
            let errMsg = '传入了错误的type，取值应该为(1,2)';
            logger.error(errMsg);
            throw new Error(errMsg);
    }
}

/**
 * 盈利排行榜
 */
async function gain(start, length) {
    const RANK = REDISKEY.RANK;
    let end = start + length;
    let oriData = await tools.RedisUtil.zrevrangewithscores(RANK.GAIN, start, end);
    return oriData;
}

/**
 * 亏损排行榜
 */
async function loss(start, length) {
    const RANK = REDISKEY.RANK;
    let end = start + length;
    let oriData = await tools.RedisUtil.zrangewithscores(RANK.LOSS, start, end);
    return oriData;
}

/**
 * 获取排行榜
 */
async function makeChart(oriData) {
    let chart = [];
    let fields = [
        ACCOUNTKEY.ID,
        ACCOUNTKEY.NICKNAME,
        ACCOUNTKEY.RECHARGE,
        ACCOUNTKEY.CASH,
        ACCOUNTKEY.GOLD,
        ACCOUNTKEY.COST,
        ACCOUNTKEY.TEST,
        ACCOUNTKEY.PLAYER_CATCH_RATE
    ];
    for (let i = 0; i < oriData.length; i += 2) {
        let id = oriData[i];
        let profit = oriData[i + 1];
        let account = await redisAccountSync.getAccountAsync(id, fields);
        let credit = Math.max((account.recharge * 3 - account.cash * 3.75), 100000);

        let gainRecentHour = await tools.BuzzUtil.getGain1HourFishingPlayer(id);
        let costRecentHour = await tools.BuzzUtil.getCost1HourFishingPlayer(id);
        let profitRecentHour = gainRecentHour - costRecentHour;
        let profitRateRecentHour = profitRecentHour / tools.MathUtil.getDenominator(costRecentHour);
        profitRateRecentHour = tools.MathUtil.makePercent(profitRateRecentHour);

        if (account) {
            let gain_data = {
                uid: account.id,
                nickname: account.nickname,
                recharge: account.recharge || 0,
                cash: account.cash || 0,
                otherCost: account.cost || 0,
                profitHistory: profit,
                profitRateHistory: 'TODO',//0.02,
                profitRecentHour: profitRecentHour,
                profitRateRecentHour: profitRateRecentHour,
                isFreeze: account.test < 0,
                catchRate: account.player_catch_rate || 1,
                gold: account.gold,
            };
            chart.push(gain_data);
        }
    }
    return chart;
}

let fake1 = {
    rows: 3,
    pages: 1,
    chart: [
        {
            uid: 123,
            nickname: 'haha',
            recharge: 300000,
            cash: 300000,
            otherCost: 10000,
            profitHistory: 2000,
            profitRateHistory: 0.02,
            profitRecentHour: 10000,
            profitRateRecentHour: 0.2,
            isFreeze: true,
            catchRate: 1,
            gold: 100
        },
        {
            uid: 123,
            nickname: 'haha',
            recharge: 300000,
            cash: 300000,
            otherCost: 10000,
            profitHistory: 2000,
            profitRateHistory: 0.02,
            profitRecentHour: 10000,
            profitRateRecentHour: 0.2,
            isFreeze: true,
            catchRate: 1,
            gold: 100
        },
        {
            uid: 123,
            nickname: 'haha',
            recharge: 300000,
            cash: 300000,
            otherCost: 10000,
            profitHistory: 2000,
            profitRateHistory: 0.02,
            profitRecentHour: 10000,
            profitRateRecentHour: 0.2,
            isFreeze: true,
            catchRate: 1,
            gold: 100
        },
    ]
};