const tools = require('../../utils/tools');
const SQL_CONFIG = require('../../../app/servers/admin/configs/sql');
const REDISKEY = require('../../database').dbConsts.REDISKEY;

/**
 * 黑名单类, 完成黑名单的添加和删除等相关操作
 */
class BlackList {
    constructor() {
        logger.error('-----------------BlackList');
    }

    /**
     * 对用户进行封号操作
     * @param {Array} uidList 用户uid列表，数组或单值
     * @param {Number} reason 封号原因，总是一个<0的数
     */
    async freeze(uidList, reason) {
        await _updateAccount(uidList, reason);
        await _addToList(uidList);
    }

    /**
     * 对用户进行解封操作
     * @param {Array} uidList 用户uid列表，数组或单值
     */
    async unfreeze(uidList) {
        await _updateAccount(uidList, 1);
        await _removeFromList(uidList);
    }

    /**
     * 黑名单添加一个用户
     * @param {Array} uidList 用户uid列表，数组或单值
     * @param {Number} reason 加入黑名单原因，总是一个<0的数
     */
    async add(uidList, reason) {
        await _addToList(uidList);
    }

    /**
     * 黑名单移除一个用户
     * @param {Array} uidList 用户uid列表，数组或单值
     */
    async remove(uidList) {
        await _removeFromList(uidList);
    }

    /**
     * 获取黑名单
     */
    async getAll() {
        return _get();
    }
}

module.exports = new BlackList();

// 添加到记录在Redis中的黑名单集合中
async function _addToList(uidList) {
    await tools.RedisUtil.sadd(REDISKEY.GLOBAL_DATA.BLACKLIST, uidList);
}

// 从Redis中的黑名单集合中移除
async function _removeFromList(uidList) {
    await tools.RedisUtil.srem(REDISKEY.GLOBAL_DATA.BLACKLIST, uidList);
}

// 更新玩家数据
async function _updateAccount(uidList, value) {
    await _updateRedis(uidList, value);
    await _updateMySQL(uidList, value);
}

// 更新玩家Redis数据
async function _updateRedis(uidList, value) {
    let data = [];
    for (let i = 0; i < uidList.length; i++) {
        data.push(['HSET', REDISKEY.TEST, uidList[i], value]);
    }
    await tools.RedisUtil.multi(data);
}

// 更新玩家MySQL数据
async function _updateMySQL(uidList, value) {
    let sql = SQL_CONFIG.updateAccount.replace('|field|', 'test').replace('|uid_list|', uidList.join(','));
    await tools.SqlUtil.query(sql, [value]);
}

// 获取黑名单列表
async function _get() {
    return await tools.RedisUtil.smembers(REDISKEY.GLOBAL_DATA.BLACKLIST);
}

