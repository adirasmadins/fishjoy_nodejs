const BuzzUtil = require('../utils/BuzzUtil');
const utils = require('../buzz/utils');
const DateUtil = require('../utils/DateUtil');
const CstError = require('../../../../consts/fish_error');
const DaoReward = require('./dao_reward');
const DaoCommon = require('./dao_common');
const _ = require('underscore');
const active_cdkey_cfg = require('../../../../utils/imports').DESIGN_CFG.active_cdkey_cfg;
const ERROR_OBJ = CstError.ERROR_OBJ;

let DEBUG = 0;
let ERROR = 1;

const TAG = '【dao_cdkey】';

//==============================================================================
// public
//==============================================================================

//------------------------------------------------------------------------------
// definition
//------------------------------------------------------------------------------
exports.generate = generate;
exports.use = use;
exports.list = list;
exports.detail = detail;

//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------

/**
 * 产生一组CD-Key.
 */
function generate(pool, data, cb) {
    if (DEBUG) logger.info('CALL dao_cdkey.generate');
    
    let action_id = data.action_id;
    let prefix = data.prefix;
    let num = data.num;
    // TODO: generateCdKeyList内部进行重复性校验
    let cdKeyList = utils.generateCdKeyList(prefix, num);

    // 插入数据库
    let sql = "";
    sql += "INSERT INTO tbl_cd_key (cd_key, action_id) VALUES ";
    for (let i = 0; i < cdKeyList.length; i++) {
        if (i > 0) {
            sql += ", ";
        }
        sql += "('" + cdKeyList[i] + "', " + action_id + ")";
    }
    if (DEBUG) logger.info('sql:', sql);
    if (DEBUG) logger.info('sql.length:', sql.length);
    
    // 此为本地数据库限制
    if (sql.length > 4194304) {
        cb(new Error("数据查询字段过长: " + sql.length));
        return;
    }
    
    // 此为租赁服云数据库限制
    if (sql.length > 16777216) {
        cb(new Error("数据查询字段过长: " + sql.length));
        return;
    }

    pool.query(sql, [], function (err, results) {
        if (err) {
            if (ERROR) logger.error("数据插入错误: ", err);
            cb(err);
            return;
        }
        // 返回生成的兑换码列表
        cb(err, cdKeyList);
    });
}

/**
 * 获取对应活动下的所有CD-Key.
 */
function list(pool, data, cb) {
    logger.info('CALL dao_cdkey.list');
    
    let action_id = data.action_id;
    
    let sql = "";
    sql += "SELECT * FROM tbl_cd_key ";
    sql += "WHERE action_id=?";
    let sql_data = [action_id];
    
    pool.query(sql, sql_data, function (err, results) {
        if (err) {
            if (ERROR) logger.error("数据查询错误: ", err);
            cb(err);
            return;
        }
        cb(null, results);
    });
}

/**
 * 使用一个CD-Key.
 * @param {*} pool 
 * @param {*} data 
 * @param {*} cb 
 */
function use(pool, data, cb) {
    const FUNC = TAG + 'use() --- ';
    BuzzUtil.cacheLinkDataApi(data, "use_cdkey");

    let token = data.token;

    DaoCommon.checkAccount(mysqlConnector, token, function(error, account) {
        if (error) {
            cb(error);
            return;
        }
        doNextWithAccount(account);
    });
    
    function doNextWithAccount(account) {

        let uid = account.id;
        // DONE: 消耗CD-KEY
        let cdkey = data.cdkey;
        _checkCdkey(pool, cdkey, uid, function (err_check_cdkey, results_check_cdkey) {
            if (err_check_cdkey) { cb(err_check_cdkey); return; }
            let action_id = results_check_cdkey.action_id;
            
            _useCdKey(pool, uid, cdkey, function (err_use_cdkey, results_use_cdkey) {
                if (err_use_cdkey) { cb(err_use_cdkey); return; }
                    
                let reward = _getRewardByActionId(action_id);
                
                DaoReward.getReward(pool, account, reward, function (err_get_reward, results_get_reward) {
                    if (err_get_reward) {
                        logger.info(JSON.stringify(err_get_reward));
                        return;
                    }
                    account.action_id = action_id;
                    cb(null, account);
                });
            });
        });
    }
}

/**
 * 显示查询CD-Key的详细信息
 * @param {*} pool 
 * @param {*} data 
 * @param {*} cb 
 */
function detail(pool, data, cb) {
    logger.info('CALL dao_cdkey.detail');
    
    let cdkey = data.cdkey;

    let sql = "";
    sql += "SELECT ";
    sql += "action_id";
    sql += ",cd_key ";
    sql += ",DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%S') AS created_at ";
    sql += ",account_id ";
    sql += ",use_time ";
    sql += "FROM tbl_cd_key ";
    sql += "WHERE cd_key=?";
    let sql_data = [cdkey];
    
    pool.query(sql, sql_data, function (err, results) {
        if (err) {
            if (ERROR) logger.error("数据查询错误: ", err);
            cb(err);
            return;
        }
        cb(null, results);
    });
}


//==============================================================================
// private
//==============================================================================

/**
 * 检查兑换码是否存在, 是否使用过.
 */
function _checkCdkey(pool, cdkey, account_id, cb) {
    const FUNC = TAG + '_checkCdkey() --- ';

    let sql = "";
    sql += "SELECT * ";
    sql += "FROM tbl_cd_key ";
    sql += "WHERE cd_key=?";
    let sql_data = [cdkey];
    
    if (DEBUG) logger.info('sql:', sql);
    if (DEBUG) logger.info('sql_data:', sql_data);
    
    pool.query(sql, sql_data, function (err, results) {
        if (err) {
            if (ERROR) logger.error("数据查询错误: ", err);
            cb(ERROR_OBJ.DB_ERR);
            return;
        }
        if (results.length == 0) {
            logger.error('-----------------------------------------------------');
            logger.error(FUNC + '没有找到对应的兑换码, 兑换码无效: dao_cdkey._checkCdkey()');
            logger.error('-----------------------------------------------------');
            cb(ERROR_OBJ.CDKEY_INVALID);
            return;
        }
        if (results.length > 1) {
            logger.error('-----------------------------------------------------');
            logger.error(FUNC + '同样的兑换码多余一条, 兑换码无效: dao_cdkey._checkCdkey()');
            logger.error('-----------------------------------------------------');
            cb(ERROR_OBJ.CDKEY_INVALID);
            return;
        }
        let cdkeyInfo = results[0];
        if (cdkeyInfo.use_time != null && cdkeyInfo.account_id != null) {
            logger.error('-----------------------------------------------------');
            logger.error(FUNC + '兑换码已经使用过, 兑换码无效: dao_cdkey._checkCdkey()');
            logger.error('-----------------------------------------------------');
            cb(ERROR_OBJ.CDKEY_USED);
            return;
        }
        let endtime = _getEndtimeByActionId(cdkeyInfo.action_id);
        if (expired(endtime)) {
            logger.error('-----------------------------------------------------');
            logger.error(FUNC + '兑换码已过期: dao_cdkey._checkCdkey()');
            logger.error('-----------------------------------------------------');
            cb(ERROR_OBJ.CDKEY_EXPIRED);
            return;
        }
        _checkRepeatGet(pool, cdkeyInfo.action_id, account_id, function (err1, results1) {
            if (err1) { cb(err1); return; }
            cb(null, cdkeyInfo);
        });
    });
}

// 检测重复领取同一活动
function _checkRepeatGet(pool, action_id, account_id, cb) {
    const FUNC = TAG + '_checkRepeatGet() --- ';

    let sql = "";
    sql += "SELECT * ";
    sql += "FROM tbl_cd_key ";
    sql += "WHERE action_id=? AND account_id=?";
    let sql_data = [action_id, account_id];
    
    if (DEBUG) logger.info('sql:', sql);
    if (DEBUG) logger.info('sql_data:', sql_data);

    pool.query(sql, sql_data, function (err, results) {
        if (err) {
            if (ERROR) logger.error("数据查询错误: ", err);
            cb(ERROR_OBJ.DB_ERR);
            return;
        }
        if (results.length > 0) {
            logger.error('-----------------------------------------------------');
            logger.error(FUNC + '玩家已经领取过同一类型的奖励: dao_cdkey._checkRepeatGet()');
            logger.error('-----------------------------------------------------');
            cb(ERROR_OBJ.CDKEY_REPEAT);
            return;
        }
        cb(null, results);
    });
}

function diff(endtime) {
    let curtime = new Date();
    let _endtime = new Date(endtime);
    if (DEBUG) logger.info("curtime: ", curtime);
    if (DEBUG) logger.info("endtime: ", _endtime);
    return curtime.getTime() - _endtime.getTime();
}

function expired(endtime) {
    return diff(endtime) > 0;
}

function _useCdKey(pool, account_id, cdkey, cb) {
    const FUNC = TAG + '_useCdKey() --- ';

    let sql = "";
    sql += "UPDATE tbl_cd_key ";
    sql += "SET account_id=?, use_time=? ";
    sql += "WHERE cd_key=?";
    let sql_data = [account_id, DateUtil.format(new Date(), "yyyy-MM-dd hh:mm:ss"), cdkey];

    if (DEBUG) logger.info('sql:', sql);
    if (DEBUG) logger.info('sql_data:', sql_data);
    
    pool.query(sql, sql_data, function (err, results) {
        if (err) {
            if (ERROR) logger.error("数据更新错误: ", err);
            cb(ERROR_OBJ.DB_ERR);
            return;
        }
        if (results.affectedRows == 0) {
            logger.error('-----------------------------------------------------');
            logger.error(FUNC + '更新操作影响数据条数为0, 兑换码无效: dao_cdkey._useCdKey()');
            logger.error('-----------------------------------------------------');
            cb(ERROR_OBJ.CDKEY_INVALID);
            return;
        }
        cb(null, results);
    });
}

function _getActionByActionId(id) {
    if (DEBUG) logger.info('active_cdkey_cfg: ', active_cdkey_cfg);
    if (DEBUG) logger.info('id: ', id);
    for (let i = 0; i < active_cdkey_cfg.length; i++) {
        let action = active_cdkey_cfg[i];
        if (action.id == id) {
            return action;
        }
    }
}

function _getRewardByActionId(id) {
    return _getActionByActionId(id).reward;
}

function _getEndtimeByActionId(id) {
    return _getActionByActionId(id).endtime;
}