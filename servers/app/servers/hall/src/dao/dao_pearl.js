const BuzzUtil = require('../utils/BuzzUtil');
const ObjUtil = require('../buzz/ObjUtil');
const DaoCommon = require('./dao_common');
const cfg = require('../buzz/cfg');
const CstError = require('../../../../consts/fish_error');
const ERROR_OBJ = CstError.ERROR_OBJ;
const CachePearl = require('../buzz/cache/CachePearl');
const CacheAccount = require('../buzz/cache/CacheAccount');

let DEBUG = 0;
let ERROR = 1;

const TAG = "【dao_pearl】";


//==============================================================================
// public
//==============================================================================

//------------------------------------------------------------------------------
// definition
//------------------------------------------------------------------------------

exports.addPearlLog = addPearlLog;
exports.addPearlLogEx = addPearlLogEx;
exports.insert = insert;

// 缓存钻石日志相关
exports.check = check;
exports.flush = flush;
exports.timing = timing;
exports.cache = cache;

/**
 * 检测gPearlLogCache长度, 超过11000条数据时将前面的10000条写入数据库中
 */
function check(pool) {
    if (CachePearl.length() > 20000) {
        insertMassive(pool, CachePearl.cache(), 20000);
    }
}

/**
 * 将gPearlLogCache全部写入数据库中
 */
function flush(pool, cb) {
    insertMassive(pool, CachePearl.cache(), CachePearl.length(), cb);
}

/**
 * 定时将金币日志写入数据库(1分钟).
 */
function timing(pool, cb) {
    let count = CachePearl.length();
    if (count > 0) {
        insertMassive(pool, CachePearl.cache(), count, cb);
    }
    else {
        if (cb != null) cb(ERROR_OBJ.CACHE_EMPTY);
    }
}

/**
 * 将gPearlLogCache全部写入数据库中
 */
function cache() {
    return CachePearl.cache();
}

/**
 * 插入大量的日志数据.
 * @param arr 插入数据的来源(队列)
 * @param num 插入数据的数目
 */
function insertMassive(pool, group, num, cb) {
    const FUNC = TAG + "insertMassive() --- ";
    
    if (group.length > 0) {
        
        let sql = '';
        sql += 'INSERT INTO `tbl_pearl_log` ';
        sql += '(`account_id`,`log_at`,`gain`,`cost`,`total`,`scene`, `nickname`) ';
        sql += 'VALUES ';
        for (let i = 0; i < group.length; i++) {
            if (i > 0) sql += ',';
            sql += '(?,?,?,?,?,?,?)';
        }
        
        let sql_data = [];
        for (let i = 0; i < num; i++) {
            let record = group.shift();
            
            sql_data.push(record.account_id);
            sql_data.push(record.log_at);
            sql_data.push(record.gain);
            sql_data.push(record.cost);
            sql_data.push(record.total);
            sql_data.push(record.scene);
            sql_data.push(record.nickname);
        }
        
        if (DEBUG) logger.info(FUNC + 'sql(' + sql.length + '):\n', sql);
        if (DEBUG) logger.info(FUNC + 'sql_data(' + sql_data.length + '):\n', sql_data);
        
        pool.query(sql, sql_data, function (err, result) {
            if (err) {
                logger.error(FUNC + 'err:\n', err);
                logger.error(FUNC + 'sql:\n', sql);
                logger.error(FUNC + 'sql_data:\n', sql_data);
                if (cb) cb(err);
            }
            else {
                if (cb) cb(null, result);
            }
        });

    }
    else {
        if (cb != null) cb(ERROR_OBJ.CACHE_EMPTY);
    }
}

//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------

function addPearlLogEx(account, data, cb) {
    const FUNC = TAG + "addPearlLog() --- ";
    DEBUG = 0;
    if (DEBUG) logger.info(FUNC + "CALL...");
    DEBUG = 0;

    let account_id = data['account_id'];
    let token = data['token'];

    if (!_prepare(data, cb)) return;
    BuzzUtil.cacheLinkDataApi(data, "add_pearl_log");

    _checkPearlData(mysqlConnector, data, account, cb);
}



/**
 * 增加珍珠流水记录
 * 需要珍珠表中的数据计算后进行验证
 */
function addPearlLog(pool, data, cb) {
    const FUNC = TAG + "addPearlLog() --- ";
    DEBUG = 0;
    if (DEBUG) logger.info(FUNC + "CALL...");
    DEBUG = 0;

    let account_id = data['account_id'];
    let token = data['token'];
    
    if (!_prepare(data, cb)) return;
    BuzzUtil.cacheLinkDataApi(data, "add_pearl_log");

    // 检查账户的合法性
    DaoCommon.checkAccount(pool, token, function (err, account) {
        if (err) {
            cb(err);
            return;
        }
        _checkPearlData(pool, data, account, cb);
    });
}

function insert(pool, data, cb, pearl_old) {
    const FUNC = TAG + "insert() --- ";

    let account_id = data['account_id'];
    let gain = data['gain'];
    let cost = data['cost'];
    let total = data['total'];
    let scene = data['scene'];
    let nickname = data['nickname'];
    
    if (total < 0) {
        if (ERROR) logger.error('=============================================');
        if (ERROR) logger.error(FUNC + '玩家钻石总数不能为负');
        if (ERROR) logger.error('=============================================');
        if (cb) cb(ERROR_OBJ.NEGATIVE_DIAMOND_ERR);
        return;
    }
    if (pearl_old != null && pearl_old + gain - cost != total) {
        if (ERROR) logger.error('=============================================');
        if (ERROR) logger.error(FUNC + '玩家钻石数量不匹配');
        if (ERROR) logger.error('=============================================');
        if (cb) cb(ERROR_OBJ.DIAMOND_MISSMATCH);
        return;
    }
    
    let sql = '';
    sql += 'INSERT INTO `tbl_pearl_log` ';
    sql += '(`account_id`,`gain`,`cost`,`total`,`scene`, `nickname`) ';
    sql += 'VALUES ';
    sql += '(?,?,?,?,?,?)';
    
    let sql_data = [account_id, gain, cost, total, scene, nickname];

    if (DEBUG) logger.info(FUNC + 'sql:\n', sql);
    if (DEBUG) logger.info(FUNC + 'sql_data:\n', sql_data);
    
    pool.query(sql, sql_data, function (err, result) {
        if (err) {
            if (ERROR) logger.error(FUNC + 'err:', err);
            if (cb) cb(err);
            return;
        }
        if (DEBUG) logger.info(FUNC + 'result: ', result);
        if (cb) cb(err, result);
    });
}


//==============================================================================
// private
//==============================================================================
/**
 * 准备工作, 准备好了返回true, 出现任何问题返回false.
 */
function _prepare(data, cb) {
    const FUNC = TAG + "_prepare() --- ";

    let account_id = data['account_id'];
    let token = data['token'];
    let total = data['total'];
    let group = data['group'];
    
    if (!_isParamExist(account_id, "接口调用请传参数account_id(玩家ID)", cb)) return false;
    if (!_isParamExist(token, "接口调用请传参数token", cb)) return false;
    if (!_isParamExist(total, "接口调用请传参数total(玩家当前持有的珍珠数)", cb)) return false;
    if (!_isParamExist(group, "接口调用请传参数group", cb)) return false;

    // BUG: 服务器能够接受客户端传入的total值为负数的情形
    if (total < 0) {
        let extraErrInfo = { debug_info: FUNC + '钻石数量不足，请先充值钻石!' };
        if (ERROR) logger.error('=============================================');
        if (ERROR) logger.error(extraErrInfo.debug_info);
        if (ERROR) logger.error('=============================================');
        cb(ObjUtil.merge(extraErrInfo, ERROR_OBJ.DIAMOND_NOT_ENOUGH));
        return false;
    }

    if (group.length == 0) {
        cb(null, { msg: "空数组不处理" });
        return false;
    }
    
    return true;
}

/**
 * 检测客户端传入的参数, 如果参数不存在，返回false, 如果通过检测, 返回true.
 * @param param 待检测的参数.
 * @param err_info 如果检测失败，回调需要传回的信息.
 */
function _isParamExist(param, err_info, cb) {
    const FUNC = TAG + "_isParamExist() --- ";

    if (param == null) {
        let extraErrInfo = { debug_info: FUNC + err_info };
        if (ERROR) logger.error('=============================================');
        if (ERROR) logger.error(extraErrInfo.debug_info);
        if (ERROR) logger.error('=============================================');
        cb(ObjUtil.merge(extraErrInfo, ERROR_OBJ.PARAM_MISSING));
        return false;
    }
    return true;
}

// 验证珍珠在数据库中的值加上gain并减去cost后是否等于total
// record + gain - cost = total
function _checkPearlData(pool, data, account, cb) {
    const FUNC = TAG + "_checkPearlData()---";

    let account_id = data['account_id'];
    let token = data['token'];
    let total = data['total'];
    let group = data['group'];
    
    if (DEBUG) logger.info(FUNC + "total:\n", total);
    if (DEBUG) logger.info(FUNC + "group:\n", group);

    let current_total = account.pearl;
            
    let temp_total = current_total;
    
    for (let i = 0; i < group.length; i++) {
        let one_change = group[i];
        if (DEBUG) logger.info(FUNC + "one_change:", one_change);
        let gain = parseInt(one_change.gain);
        let cost = parseInt(one_change.cost);
        let scene = parseInt(one_change.scene);
        
        if (isNaN(gain)) {
            let extraErrInfo = { debug_info: FUNC + "gain字段请勿输入非数值: " + one_change.gain};
            if (ERROR) logger.error('=============================================');
            if (ERROR) logger.error(extraErrInfo.debug_info);
            if (ERROR) logger.error('=============================================');
            cb(ObjUtil.merge(extraErrInfo, ERROR_OBJ.PARAM_WRONG_TYPE));
            return;
        }
        
        if (isNaN(cost)) {
            let extraErrInfo = { debug_info: FUNC + "cost字段请勿输入非数值: " + one_change.cost };
            if (ERROR) logger.error('=============================================');
            if (ERROR) logger.error(extraErrInfo.debug_info);
            if (ERROR) logger.error('=============================================');
            cb(ObjUtil.merge(extraErrInfo, ERROR_OBJ.PARAM_WRONG_TYPE));
            return;
        }
        // 商城场景不做增减(购买皮肤也是商城场景，坑爹了)
        temp_total = temp_total + gain - cost;
    }
        
    let nickname = (account.nickname != null);

    if (temp_total == total) {
        _didAddPearlLog(pool, data, account, cb, current_total, nickname);
    }
    else {
        let errInfo = FUNC + '用户数据异常: (计算后总量-' + temp_total + ', 客户端上传总量-' + total + ')';
        if (ERROR) logger.error(errInfo);
        if (cfg.debug_cfg.FORCE_SAVE_PEARL_DATA) {
            _didAddPearlLog(pool, data, account, cb, current_total, nickname);
        }
        else {
            cb(new Error(errInfo));
        }
    }
}

// 验证后加入一条log
function _didAddPearlLog(pool, data, account, cb, current_total, nickname) {
    const FUNC = TAG + "_didAddPearlLog()---";

    let account_id = data['account_id'];
    let total = data['total'];
    let group = data['group'];

    // TODO: 缓存钻石LOG
    let temp_total = current_total;
    let total_gain = 0;
    let total_cost = 0;
    for (let i = 0; i < group.length; i++) {
        let one_change = group[i];
        total_gain += one_change.gain;
        total_cost += one_change.cost;
        let temp_total = temp_total + one_change.gain - one_change.cost;

        if (one_change.gain > 0 || one_change.cost > 0) {
            // CachePearl.push({
            //     account_id: account_id,
            //     log_at: DateUtil.getTime(),
            //     gain: one_change.gain,
            //     cost: one_change.cost,
            //     total: temp_total,
            //     scene: one_change.scene,
            //     nickname: nickname,
            // });
            logBuilder.addPearlLogEx({
                account_id: account_id,
                log_at: new Date(),
                gain: one_change.gain,
                cost: one_change.cost,
                total: temp_total,
                scene: one_change.scene,
                nickname: 0,
            });
        }
    }
    check(pool);
    _updatePearlTable(pool, data, account, cb, total_gain, total_cost);
}

// 更新tbl_pearl表中的current_total, total_gain, total_cost字段
function _updatePearlTable(pool, data, account, cb, total_gain, total_cost) {
    const FUNC = TAG + "_updatePearlTable()---";

    let account_id = data['account_id'];
    let total = data['total'];
    
    //--------------------------------------------------------------------------
    // 更新缓存中的钻石数据(重要:数据库操作将会被删除, 注意缓存tbl_pearl的数据)
    //--------------------------------------------------------------------------
    // 直接设置钻石数据,注意钻石是增量
    account.pearl = total - account.pearl;
    account.commit();
    //--------------------------------------------------------------------------
    cb(null);
}