const SQL_CONFIG = require('../../configs/sql');
const REDISKEY = require('../../../../models/index').REDISKEY;
const tools = require('../../../../utils/tools');
const PlayerData = require('../../configs/consts/PlayerData');

/**
 * 获取玩家账户数据
 * @param {*} data {uid:100} 
 */
exports.get = async function (data, ctx) {
    // console.log('data:', data);
    try {
        await modifyData(data.uid, Number(data.key), data.value);
        return {
            result: true
        };
    }
    catch (err) {
        return {
            result: false,
            err: err.toString()
        };
    }
};

/**
 * 修改玩家数据.
 * @param {*} uid 修改玩家的UID
 * @param {*} key 需要修改的玩家的键
 * @param {*} value 需要修改的玩家的值
 */
async function modifyData(uid, key, value) {
    switch (key) {
        case PlayerData.PASSWORD:
            key = 'password';
            // TODO: 需要确认当前版本生成密码密文的算法
            break;
        case PlayerData.GOLD:
            key = 'gold';
            await tools.RedisUtil.hset(REDISKEY.GOLD, uid, value);
            break;
        case PlayerData.PEARL:
            key = 'pearl';
            await tools.RedisUtil.hset(REDISKEY.PEARL, uid, value);
            break;
        case PlayerData.ITEM:
            key = 'package';
            await tools.RedisUtil.hset(REDISKEY.PACKAGE, uid, value);
            value = "'" + value + "'";
            break;
        case PlayerData.IS_FREEZE:
            key = 'test';
            // TODO: 无法弹框写封号原因
            value = value === 'true' ? -1 : 0;
            break;
        case PlayerData.IS_BLOCKED:
            key = 'black';
            value = value === 'true' ? -1 : 0;
            break;

        // 新增无后台调用可修改属性
        case PlayerData.MONTH_CARD:
            key = 'card';
            await tools.RedisUtil.hset(REDISKEY.CARD, uid, value);
            value = "'" + value + "'";
            break;
        case PlayerData.MONTH_CARD_REWARD:
            key = 'get_card';
            await tools.RedisUtil.hset(REDISKEY.GET_CARD, uid, value);
            value = "'" + value + "'";
            break;
        case PlayerData.SKILL:
            key = 'skill';
            await tools.RedisUtil.hset(REDISKEY.SKILL, uid, value);
            value = "'" + value + "'";
            break;
        case PlayerData.FIRST_BUY_GIFT:
            key = 'first_buy_gift';
            await tools.RedisUtil.hset(REDISKEY.FIRST_BUY_GIFT, uid, value);
            break;
        case PlayerData.RMB:
            key = 'rmb';
            await tools.RedisUtil.hset(REDISKEY.RMB, uid, value);
            break;
        case PlayerData.MAIL_BOX:
            key = 'mail_box';
            await tools.RedisUtil.hset(REDISKEY.MAIL_BOX, uid, value);
            value = "'" + value + "'";
            break;
        case PlayerData.FREE_DRAW:
            key = 'free_draw';
            await tools.RedisUtil.hset(REDISKEY.FREE_DRAW, uid, value);
            value = "'" + value + "'";
            break;
        case PlayerData.TOTAL_DRAW:
            key = 'total_draw';
            await tools.RedisUtil.hset(REDISKEY.TOTAL_DRAW, uid, value);
            value = "'" + value + "'";
            break;
        case PlayerData.BONUS:
            key = 'bonus';
            await tools.RedisUtil.hset(REDISKEY.BONUS, uid, value);
            value = "'" + value + "'";
            break;
        case PlayerData.VIP_GIFT:
            key = 'vip_gift';
            await tools.RedisUtil.hset(REDISKEY.VIP_GIFT, uid, value);
            value = "'" + value + "'";
            break;
        case PlayerData.VIP_DAILY_REWARD:
            key = 'vip_daily_reward';
            await tools.RedisUtil.hset(REDISKEY.VIP_DAILY_REWARD, uid, value);
            break;
        case PlayerData.WEAPON:
            key = 'weapon';
            await tools.RedisUtil.hset(REDISKEY.WEAPON, uid, value);
            // 注意，决定武器等级的字段还有一个weapon_energy
            let weapon_energy = await tools.RedisUtil.hget(REDISKEY.WEAPON_ENERGY, uid);
            weapon_energy = JSON.parse(weapon_energy);
            for (let level in weapon_energy) {
                if (Number(level) > Number(value)) {
                    delete weapon_energy[level];
                }
            }
            await tools.RedisUtil.hset(REDISKEY.WEAPON_ENERGY, uid, JSON.stringify(weapon_energy));
            break;
        case PlayerData.CARD:
            key = 'card';
            await tools.RedisUtil.hset(REDISKEY.CARD, uid, value);
            value = "'" + value + "'";
            break;
        case PlayerData.GET_CARD:
            key = 'get_card';
            await tools.RedisUtil.hset(REDISKEY.GET_CARD, uid, value);
            value = "'" + value + "'";
            break;
    }
    let sql = SQL_CONFIG.modifyAccount
        .replace('target_key', key)
        .replace('target_value', value)
        .replace('uid_list', uid);
    // logger.error('sql:\n', sql);
    await tools.SqlUtil.query(sql, []);
}