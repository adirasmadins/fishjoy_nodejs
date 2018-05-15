const SQL_CONFIG = require('../../configs/sql');
const tools = require('../../../../utils/tools');
const PlayerData = require('../../configs/consts/PlayerData');
const ERROR_OBJ = require('../../../../consts/fish_error').ERROR_OBJ;

/**
 * 获取玩家账户数据
 * @param {*} data {uid:100} 
 */
exports.get = async function (data, ctx) {
    // console.log('data:', data);
    let account = makeAccount(await fetchData(data.uid));

    return account;
};

/**
 * 数据转换(数据库原始数据 -> 客户端可以处理的数据形式)
 * @param {*} list 
 */
function makeAccount(list) {
    let ret = [];
    for (let i = 0; i < list.length; i++) {
        let account = list[i];
        ret.push({
            nickname: account.nickname,
            uid: account.id,
            accountType: 'TODO',
            recharge: account.rmb,
            cash: account.cash,
            profitRateHistory: 'TODO',
            password: {
                key: PlayerData.PASSWORD,
                value: '******'
            },
            gold: {
                key: PlayerData.GOLD,
                value: account.gold
            },
            pearl: {
                key: PlayerData.PEARL,
                value: account.pearl
            },
            item: {
                key: PlayerData.ITEM,
                value: account.package
            },
            itemUsed: 'TODO',
            isFreeze: {
                key: PlayerData.IS_FREEZE,
                value: account.test < 0
            },
            isBlocked: {
                key: PlayerData.IS_BLOCKED,
                value: account.black < 0// TODO
            }
        });
    }
    if (ret.length == 0) {
        throw ERROR_OBJ.ACCOUNT_NULL;
    }
    return ret[0];
}

/**
 * 获取玩家数据.
 * @param {*} uid_list 查询玩家的UID
 */
async function fetchData(uid_list) {
    if (uid_list) {
        let sql = SQL_CONFIG.queryAccount.replace('uid_list', uid_list);
        return await tools.SqlUtil.query(sql, []);
    }
    return [];
}
