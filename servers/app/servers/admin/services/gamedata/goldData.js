const SQL_CONFIG = require('../../configs/sql');
const tools = require('../../../../utils/tools');

/**
 * 获取充值排名接口需要的返回值
 * @param {*} data {date:'YYYY-MM-DD'} 
 */
exports.get = async function (data, ctx) {
    logger.error('data:', data);
    // 调试用
    // data.date = '2018-01-01';

    try {
        let hours = tools.DateUtil.make24Hour(data.date);
        let cost = await fetchData(data.date, 'cost', hours);
        let gain = await fetchData(data.date, 'gain', hours);
        // logger.error('cost:', cost);
        return {
            gainTotal: 123456,
            costTotal: 103456,
            cost: cost,
            gain: gain
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

async function fetchData(date, type, hours) {
    let ret = [];
    let dateTargetTable = tools.DateUtil.format(date, tools.DateUtil.FMT.DB);
    let dateTodayTable = tools.DateUtil.format(new Date(), tools.DateUtil.FMT.DB);
    // TODO: 需要将每小时的数据进行即时统计, 只有当前这个小时的数据才进行实时查询
    if (dateTargetTable == dateTodayTable) {
        // 查tbl_gold_log
        for (let i = 0; i < hours.length; i++) {
            let hourInfo = hours[i];
            let start = hourInfo.start;
            let end = hourInfo.end;
            let sql = SQL_CONFIG.getGoldData.replace('|type|', type);
            if ('cost' == type) {
                let cash = (await tools.SqlUtil.query(sql, [tools.BuzzUtil.SCENE.CIK, start, end]))[0].sum;
                let fishingCost = (await tools.SqlUtil.query(sql, [tools.BuzzUtil.SCENE.GAME_FIGHTING, start, end]))[0].sum;
                let buySkin = (await tools.SqlUtil.query(sql, [tools.BuzzUtil.SCENE.SKIN_BUY, start, end]))[0].sum;
                let buySkill = (await tools.SqlUtil.query(sql, [tools.BuzzUtil.SCENE.SKILL_BUY, start, end]))[0].sum;
                let nuclear = (await tools.SqlUtil.query(sql, [tools.BuzzUtil.SCENE.NUCLER_COST, start, end]))[0].sum;
                let active = (await tools.SqlUtil.query(sql, [tools.BuzzUtil.SCENE.ACTIVE_COST, start, end]))[0].sum;
                let buyRuby = (await tools.SqlUtil.query(sql, [tools.BuzzUtil.SCENE.GOLD_BUY, start, end]))[0].sum;
                let buyCard = (await tools.SqlUtil.query(sql, [tools.BuzzUtil.SCENE.CARD, start, end]))[0].sum;
                let buyVipGift = (await tools.SqlUtil.query(sql, [tools.BuzzUtil.SCENE.VIPGIFT_BUY, start, end]))[0].sum;
                let give = (await tools.SqlUtil.query(sql, [tools.BuzzUtil.SCENE.REWARD_PEOPLE, start, end]))[0].sum;//TODO: 检查代码中打赏消耗金币是否记录到这个字段
                let draw = (await tools.SqlUtil.query(sql, [tools.BuzzUtil.SCENE.ACTIVE_DRAW, start, end]))[0].sum;
                let other = 0;
                let cost = {
                    time: hourInfo.range,
                    totalGain: 'TODO',
                    totalCost: 'TODO',
                    cash: cash || 0,
                    fishingCost: fishingCost || 0,
                    buySkin: buySkin || 0,
                    buySkill: buySkill || 0,
                    nuclear: nuclear || 0,
                    active: active || 0,
                    buyRuby: buyRuby || 0,
                    buyCard: buyCard || 0,
                    buyVipGift: buyVipGift || 0,
                    give: give || 0,
                    draw: draw || 0,
                    other: other || 0,
                };
                ret.push(cost);
            }
            if ('gain' == type) {
                let topup = (await tools.SqlUtil.query(sql, [tools.BuzzUtil.SCENE.STORE, start, end]))[0].sum;
                let gift = (await tools.SqlUtil.query(sql, [tools.BuzzUtil.SCENE.TIMEGIFT_BUY, start, end]))[0].sum;
                let fishingWin = (await tools.SqlUtil.query(sql, [tools.BuzzUtil.SCENE.GAME_FIGHTING, start, end]))[0].sum;
                let nuclear = (await tools.SqlUtil.query(sql, [tools.BuzzUtil.SCENE.NUCLER_DROP, start, end]))[0].sum;
                let active = (await tools.SqlUtil.query(sql, [tools.BuzzUtil.SCENE.ACTIVE_QUEST, start, end]))[0].sum;
                let mail = (await tools.SqlUtil.query(sql, [tools.BuzzUtil.SCENE.MAIL, start, end]))[0].sum;
                let benefit = (await tools.SqlUtil.query(sql, [tools.BuzzUtil.SCENE.BROKE_GAIN, start, end]))[0].sum;
                let monthCard = (await tools.SqlUtil.query(sql, [tools.BuzzUtil.SCENE.CARD_REWARD, start, end]))[0].sum;
                let firstTopup = (await tools.SqlUtil.query(sql, [tools.BuzzUtil.SCENE.FIRST_BUY, start, end]))[0].sum;
                let draw = (await tools.SqlUtil.query(sql, [tools.BuzzUtil.SCENE.ACTIVE_DRAW, start, end]))[0].sum;
                let goldenFish = (await tools.SqlUtil.query(sql, [tools.BuzzUtil.SCENE.GOLDFISH_GAIN, start, end]))[0].sum;
                let gain = {
                    time: hourInfo.range,
                    totalGain: 'TODO',
                    totalCost: 'TODO',
                    topup: topup || 0,
                    gift: gift || 0,
                    fishingWin: fishingWin || 0,
                    nuclear: nuclear || 0,
                    active: active || 0,
                    mail: mail || 0,
                    benefit: benefit || 0,
                    monthCard: monthCard || 0,
                    firstTopup: firstTopup || 0,
                    draw: draw || 0,
                    goldenFish: goldenFish || 0
                };
                ret.push(gain);
            }
        }
    }
    else {
        // 查tbl_stat_hour_gold
        let allDayData = await tools.SqlUtil.query(SQL_CONFIG.getGoldDataHistory, tools.ObjUtil.makeSqlDataFromTo(date, date));
        // logger.error('allDayData:', allDayData);
        for (let i = 0; i < allDayData.length; i++) {
            if ('cost' == type) {
                let hourData = allDayData[i];
                let cost = {
                    time: tools.DateUtil.getHourRange(hourData.time),
                    totalGain: hourData.totalGain,
                    totalCost: hourData.totalCost,
                    cash: hourData.cash,
                    fishingCost: hourData.fishingCost,
                    buySkin: hourData.buySkin,
                    buySkill: hourData.buySkill,
                    nuclear: hourData.buyNuclear,
                    active: hourData.activeCost,
                    buyRuby: hourData.buyRuby,
                    buyCard: hourData.buyCard,
                    buyVipGift: hourData.buyVipGift,
                    give: hourData.give,
                    draw: hourData.drawCost,
                    other: hourData.otherCost,
                };
                ret.push(cost);
            }
            if ('gain' == type) {
                let hourData = allDayData[i];
                let gain = {
                    time: tools.DateUtil.getHourRange(hourData.time),
                    totalGain: hourData.totalGain,
                    totalCost: hourData.totalCost,
                    topup: hourData.topup,
                    gift: hourData.gift,
                    fishingWin: hourData.fishingWin,
                    nuclear: hourData.nuclearGain,
                    active: hourData.activeGain,
                    mail: hourData.mail,
                    benefit: hourData.benefit,
                    monthCard: hourData.monthCard,
                    firstTopup: hourData.firstTopup,
                    draw: hourData.drawGain,
                    goldenFish: hourData.goldenFish
                };
                ret.push(gain);
            }
        }

    }
    // logger.error('ret:', ret);
    return ret;
}
