const change_change_cfg = require('../../../../../utils/imports').DESIGN_CFG.change_change_cfg;

let ERROR = 1;
let DEBUG = 0;


//==============================================================================
// global letiable
//==============================================================================
// 使用说明: 定时存储记录, 存储时用队列方式
// 记录下当前长度len, 从队列中移除len个数据存入数据库, 等待下个周期
// 每一条记录格式如下
/**
Operation = 
{
    id: bigint,
    desc: letchar,
    value: int,
    type: int,
}
 */
let gOperationCache = [];


//==============================================================================
// public
//==============================================================================

//------------------------------------------------------------------------------
// definition
//------------------------------------------------------------------------------
// 缓存连接日志相关
exports.init = init;
exports.push = push;
exports.cache = cache;
exports.obj = obj;
exports.length = length;
exports.findCfgsById = findCfgsById;
exports.findCfgsByType = findCfgsByType;
exports.update = update;
exports.updateDesc = updateDesc;
exports.updateValue = updateValue;
exports.updateCid = updateCid;
exports.change = change;
exports.reduce = reduce;
exports.getChangeDailyLeft = getChangeDailyLeft;
exports.findValueByCid = findValueByCid;

exports.addStore = addStore;
exports.addStore4Cancel = addStore4Cancel;
exports.dailyReset = dailyReset;


//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------

/**
 * 初始化所有数据.
 */
function init(data) {
    if(!data) return;
    for (let i = 0; i < data.length; i++) {
        // logger.info("data[i]:", data[i]);
        // logger.info("id:", data[i].id);
        gOperationCache.push(data[i]);
    }
}

/**
 * 检测gOperationCache长度, 超过11000条数据时将前面的10000条写入数据库中
 */
function push(data) {
    gOperationCache.push(data);
}

/**
 * 将gOperationCache全部写入数据库中
 */
function cache() {
    return gOperationCache;
}

function obj() {
    let ret = {};
    for (let idx in gOperationCache) {
        let op = gOperationCache[idx];
        ret["" + op.id] = gOperationCache[idx];
    }
    return ret;
}

/**
 * 将gOperationCache全部写入数据库中
 */
function length() {
    return gOperationCache.length;
}

function findCfgsByType(type) {
    let ret = [];
    for (let i = 0; i < gOperationCache.length; i++) {
        let op = gOperationCache[i];
        if (type == op.type) {
            ret.push(op);
        }
    }
    return ret;
}

function findCfgsById(oid) {
    for (let i = 0; i < gOperationCache.length; i++) {
        let op = gOperationCache[i];
        if (oid == op.id) {
            return op;
        }
    }
    return null;
}

function findValueByCid(cfg_id, type) {
    for (let i = 0; i < gOperationCache.length; i++) {
        let op = gOperationCache[i];
        if (cfg_id == op.cfg_id) {
            if (1 == type && 1 == op.cfg_id % 2) {
                return op;
            }
            else if (2 == type && 0 == op.cfg_id % 2) {
                return op;
            }
        }
    }
    return null;
}

/**
 * 修改配置.
 */
function update(oid, desc, value) {
    let ret = [];
    for (let i = 0; i < gOperationCache.length; i++) {
        let op = gOperationCache[i];
        if (oid == op.id) {
            op.desc = desc;
            op.value = value;
        }
    }
    return ret;
}

function updateDesc(oid, desc) {
    let ret = [];
    for (let i = 0; i < gOperationCache.length; i++) {
        let op = gOperationCache[i];
        if (oid == op.id) {
            op.desc = desc;
        }
    }
    return ret;
}

function updateValue(oid, value) {
    let ret = [];
    for (let i = 0; i < gOperationCache.length; i++) {
        let op = gOperationCache[i];
        if (oid == op.id) {
            op.value = value;
        }
    }
    return ret;
}

function updateCid(oid, cid) {
    let ret = [];
    for (let i = 0; i < gOperationCache.length; i++) {
        let op = gOperationCache[i];
        if (oid == op.id) {
            op.cfg_id = cid;
        }
    }
    return ret;
}

/**
 * 改变库存.
 */
function change(oid, change) {
    change = parseInt(change);
    let ret = [];
    for (let i = 0; i < gOperationCache.length; i++) {
        let op = gOperationCache[i];
        if (oid == op.id) {
            op.value += change;
            if (op.value < 0) {
                op.value = 0;
            }
        }
    }
    return ret;
}

/**
 * 减少数量.
 */
function reduce(cfg_id, type, value) {
    for (let i = 0; i < gOperationCache.length; i++) {
        let op = gOperationCache[i];
        if (cfg_id == op.cfg_id) {
            if (1 == type && 1 == op.cfg_id % 2) {
                op.value -= value;
            }
            else if (2 == type && 0 == op.cfg_id % 2) {
                op.value -= value;
            }
        }
    }
}

/**
 * 获取实物兑换的每日剩余数量.
 */
function getChangeDailyLeft() {
    let ret = {};
    for (let i = 0; i < gOperationCache.length; i++) {
        let op = gOperationCache[i];
        if (1 == op.type && 1 == op.id % 2) {
            ret[op.cfg_id] = {"left":op.value};
        }
    }
    return ret;
}

/**
 * 增加相应的库存(每日和总库存).
 */
function addStore(cid, num) {
    for (let i = 0; i < gOperationCache.length; i++) {
        let op = gOperationCache[i];
        if (cid == op.cfg_id) {
            op.value += num;
        }
    }
}

/**
 * 取消订单后需要增加相应的库存(跨天只加总库存，当天取消就总库存和当日库存同时增加).
 * @param cid change_id 用于查找增加库存的条目
 * @param num 库存增加数量
 * @param cross_cancel 是否跨天取消
 */
function addStore4Cancel(cid, num, cross_cancel) {
    for (let i = 0; i < gOperationCache.length; i++) {
        let op = gOperationCache[i];
        if (cid == op.cfg_id) {
            if (cross_cancel && op.id % 2 == 0) {
                op.value += num;
            }
            else {
                op.value += num;
            }
        }
    }
}

/**
 * 重置每日库存.
 */
function dailyReset() {
    for (let i = 0; i < gOperationCache.length; i++) {
        let op = gOperationCache[i];
        if (op.cfg_id != null && op.id % 2 == 1) {
            for (let idx in change_change_cfg) {
                let change_info = change_change_cfg[idx];
                if (change_info.id == op.cfg_id) {
                    op.value = change_info.count;
                }
            }
        }
    }
}

