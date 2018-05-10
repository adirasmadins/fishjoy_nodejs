const BuzzUtil = require('../utils/BuzzUtil');
const ObjUtil = require('../buzz/ObjUtil');
const DateUtil = require('../utils/DateUtil');
const ArrayUtil = require('../utils/ArrayUtil');
const CstError = require('../../../../consts/fish_error');
const DaoCommon = require('./dao_common');
const buzz_cst_game = require('../buzz/cst/buzz_cst_game');
const Global = require('../buzz/pojo/Global');
const CacheGold = require('../buzz/cache/CacheGold');
const CacheAccount = require('../buzz/cache/CacheAccount');
const CacheUserException = require('../buzz/cache/CacheUserException');
const common_log_const_cfg = require('../../../../utils/imports').DESIGN_CFG.common_log_const_cfg;
const ERROR_OBJ = CstError.ERROR_OBJ;
const GameEventBroadcast = require('../../../../common/broadcast/GameEventBroadcast');

let DEBUG = 0;
let ERROR = 1;

const TAG = "【dao_gold】";

//=======================================================================================
// 场景字段每个数值的含义
//=======================================================================================

//=======================================================================================
// public
//=======================================================================================

//------------------------------------------------------------------------------
// definition
//------------------------------------------------------------------------------
exports.addGoldLog = addGoldLog;
exports.addGoldLogEx = addGoldLogEx;
exports.addGoldLogCache = addGoldLogCache;
exports.writeUserException = writeUserException;
exports.insert = insert;
exports.getOnlineTime = getOnlineTime;

// 缓存金币日志相关
exports.check = check;
exports.flush = flush;
exports.timing = timing;
exports.cache = cache;
exports.mathWater = mathWater;


//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------

/**
 * 计算"玩家捕鱼总消耗/玩家捕鱼总收入"
SELECT (1 - SUM(gain)/SUM(cost)) AS extract 
FROM `tbl_gold_log` 
WHERE scene IN (3,5,11) 
AND level > 15 
AND log_at > '2017-09-11 15:00:00'
 */
function mathWater(pool, cb) {
    let FUNC = TAG + "mathWater() --- ";

    let oneday = new Date().getTime();
    oneday = DateUtil.getTimeFromTimestamp(oneday - 1000 * 60 * 60 * 24);

    let sql = "";
    sql += "SELECT (1 - SUM(gain)/SUM(cost)) AS extract ";
    sql += "FROM `tbl_gold_log` ";
    sql += "WHERE scene IN (3,103,203,29,129,229,5,11) ";
    sql += "AND level > 15 ";
    sql += "AND log_at > '" + oneday + "' ";
    let sql_data = [];

    if (DEBUG) logger.info(FUNC + 'sql:\n', sql);
    if (DEBUG) logger.info(FUNC + 'sql_data:\n', sql_data);

    pool.query(sql, sql_data, function (err, result) {
        // logger.info(FUNC + 'result:', result);
        if (result == null || result.length == 0) {
            cb(err, 1);
            return;
        }
        cb(err, result[0].extract);
    });
}

/**
 * 检测gGoldLogCache长度, 超过11000条数据时将前面的10000条写入数据库中
 */
function check(pool) {
    if (CacheGold.length() > 20000) {
        insertMassive(pool, CacheGold.cache(), 20000);
    }
}

/**
 * 将gGoldLogCache全部写入数据库中
 */
function flush(pool, cb) {
    insertMassive(pool, CacheGold.cache(), CacheGold.length(), cb);
}

/**
 * 定时将金币日志写入数据库(1分钟).
 */
function timing(pool, cb) {
    let count = CacheGold.length();
    if (count > 0) {
        insertMassive(pool, CacheGold.cache(), count, cb);
    }
    else {
        cb && cb(ERROR_OBJ.CACHE_EMPTY);
    }
}

function writeUserException(pool, cb) {
    let count = CacheUserException.length();
    if (count > 0) {
        insertMassiveUserException(pool, CacheUserException.cache(), count, cb);
    }
    else {
        cb && cb(ERROR_OBJ.CACHE_EMPTY);
    }
}

/**
 * 将gGoldLogCache全部写入数据库中
 */
function cache() {
    return CacheGold.cache();
}



function addGoldLogEx(account, data, cb) {
    const FUNC = TAG + "addGoldLog() --- ";

    let account_id = data['account_id'];
    let token = data['token'];
    let total = data['total'];
    let duration = data['duration'];
    let group = data['group'];

    if (!_prepare(data, cb)) return;
    BuzzUtil.cacheLinkDataApi(data, "add_gold_log");

    if (total < 0) {
        logger.error(FUNC + '玩家金币总数不能为负');
        cb(ERROR_OBJ.GOLD_NOT_ENOUGH);
        return;
    }
    doNext(account, data, cb);
}


const CLIENT_UPDATE_SCENE = [
    common_log_const_cfg.GAME_FIGHTING,
    common_log_const_cfg.NUCLER_DROP,
    common_log_const_cfg.NUCLER_LASER,
    common_log_const_cfg.GAME_FIGHTING + 100,
    common_log_const_cfg.NUCLER_DROP + 100,
    common_log_const_cfg.NUCLER_LASER + 100,
    common_log_const_cfg.GAME_FIGHTING + 200,
    common_log_const_cfg.NUCLER_DROP + 200,
    common_log_const_cfg.NUCLER_LASER + 200,
    common_log_const_cfg.MINI_GAME,
    common_log_const_cfg.BE_STOLEND,
];

/**
 * 增加一条金币流水记录(客户端专用, 用于更新客户端打鱼，激光，核弹，小游戏获取和消耗的金币记录).
 * 需要金币表中的数据计算后进行验证.
 */
function addGoldLog(pool, data, cb) {
    const FUNC = TAG + "addGoldLog() --- ";

    let account_id = data['account_id'];
    let token = data['token'];
    let total = data['total'];
    let duration = data['duration'];
    let group = data['group'];
    
    if (!_prepare(data, cb)) return;
    BuzzUtil.cacheLinkDataApi(data, "add_gold_log");
    
    if (total < 0) {
        logger.error(FUNC + '玩家金币总数不能为负');
        cb(ERROR_OBJ.GOLD_NOT_ENOUGH);
        return;
    }

    DaoCommon.checkAccount(pool, token, function(err, account){
        if (err) {
            cb(err);
            return;
        }

        // if (account_id == 21) {
        //     let uid = account_id;
        //     // addGoldLog() --- 21-玩家等级:
        //     logger.info(FUNC + uid + "-玩家等级:", account.level);
        // }
        doNext(account, data, cb);
    });

}


function doNext(account, data, cb) {
    const FUNC = TAG + "addGoldLog() doNext --- ";
    let total = data['total'];
    let duration = data['duration'];
    let group = data['group'];
    let account_id = data['account_id'];
    let uid = account.id;

    let current_total = account.gold;
    let temp_total = current_total;

        let exceptionScene = 0;
        for (let i = 0; i < group.length; i++) {
            let one_change = group[i];
            if (DEBUG) logger.info(FUNC + "one_change:", one_change);
            let gain = parseInt(one_change.gain);
            let cost = parseInt(one_change.cost);
            let scene = parseInt(one_change.scene);
            
            if (isNaN(gain)) {
                let extraErrInfo = { debug_info: FUNC + "gain字段请勿输入非数值: " + one_change.gain };
                logger.error(extraErrInfo.debug_info);
                cb && cb(ObjUtil.merge(extraErrInfo, ERROR_OBJ.PARAM_WRONG_TYPE));
                return;
            }
            
            if (isNaN(cost)) {
                let extraErrInfo = { debug_info: FUNC + "cost字段请勿输入非数值: " + one_change.cost };
                logger.error(extraErrInfo.debug_info);
                cb && cb(ObjUtil.merge(extraErrInfo, ERROR_OBJ.PARAM_WRONG_TYPE));
                return;
            }
            temp_total = temp_total + gain - cost;

            if (!ArrayUtil.contain(CLIENT_UPDATE_SCENE, scene)) {
                exceptionScene = scene;
            }
        }

        let nickname = (account.nickname != null);
        
        if (total < 0) {
            // 报错返回, 不再更新数据库和内存
            cb && cb(ERROR_OBJ.NEGATIVE_GOLD_ERR);
            return;
        }

        // logger.info(FUNC + "===================account_id:", uid);
        if (temp_total == total) {
            _didAddGoldLog(mysqlConnector, account, data, cb, current_total, nickname);
        }
        else {
            let delta_total = total - temp_total;
            let errInfo = FUNC + '用户数据异常: (计算后总量: ' + temp_total + ', 客户端上传总量: ' + total + ', 差额(客户端增量): ' + delta_total + ')';
            if (ERROR) logger.error(errInfo);
            if (delta_total > 100000) {
                // 在有些场景中会事先将account中的金币数进行修改, 这里的检测不准确
                logger.error(FUNC + "[EXCEPTION]客户端居然有" + delta_total + "金币没有同步到服务器, OMG!!!");
            }

            if (exceptionScene > 0) {
                logger.error(FUNC + "客户端不该更新这个场景---exceptionScene:", exceptionScene);
                _didAddGoldLog(mysqlConnector, account, data, cb, total, nickname);
            }
            else {
                if (delta_total > 0) {
                    if (uid == 21 || uid == 49766 || uid == 7926 || (uid <= 69930 && uid >= 69900) || uid == 717730) {
                        logger.error(FUNC + "玩家数据异常, 下线处理-uid:", uid);
                        logger.error(FUNC + "group:", group);
                        logger.error(FUNC + "old_gold:", account.gold);
                        cb && cb(ERROR_OBJ.TOKEN_INVALID);
                    }
                    else {
                        // 增量 < 0 不做处理
                        _didAddGoldLog(mysqlConnector, account, data, cb, total, nickname);
                    }
                }
                else {
                    // 指定玩家进行校验, 其他玩家不做处理
                    _didAddGoldLog(mysqlConnector, account, data, cb, total, nickname);
                }
                // logger.error(FUNC + "玩家数据异常, 下线处理-uid:", uid);
                // cb && cb(ERROR_OBJ.TOKEN_INVALID);
            }
        }
}


/** 服务器更新金币日志专用. */
function addGoldLogCache(pool, data, cb) {
    const FUNC = TAG + "addGoldLog() --- ";

    let account_id = data['account_id'];
    let token = data['token'];
    let total = data['total'];
    let duration = data['duration'];
    let group = data['group'];

    if (!_prepare(data, cb)) return;
    BuzzUtil.cacheLinkDataApi(data, "add_gold_log");

    if (total < 0) {
        logger.error(FUNC + '玩家金币总数不能为负');
        cb && cb(ERROR_OBJ.GOLD_NOT_ENOUGH);
        return;
    }

    // let uid = account_id;
    DaoCommon.checkAccount(pool, token, function(err, account){
        if (err) {
            cb && cb(err);
            return;
        }

        doNext(account);
    });

    function doNext(account) {
        let current_total = account.gold;
        if (group.length == 1) {
            let one_change = group[0];
            let delta_gold = one_change.gain - one_change.cost;
            current_total -= delta_gold;
        }
        // let temp_total = current_total;

        // for (let i = 0; i < group.length; i++) {
        //     let one_change = group[i];
        //     if (DEBUG) logger.info(FUNC + "one_change:", one_change);
        //     let gain = parseInt(one_change.gain);
        //     let cost = parseInt(one_change.cost);

        //     if (isNaN(gain)) {
        //         let extraErrInfo = { debug_info: FUNC + "gain字段请勿输入非数值: " + one_change.gain };
        //         if (ERROR) logger.error('------------------------------------------------------');
        //         if (ERROR) logger.error(extraErrInfo.debug_info);
        //         if (ERROR) logger.error('------------------------------------------------------');
        //         cb && cb(ObjUtil.merge(extraErrInfo, ERROR_OBJ.PARAM_WRONG_TYPE));
        //         return;
        //     }

        //     if (isNaN(cost)) {
        //         let extraErrInfo = { debug_info: FUNC + "cost字段请勿输入非数值: " + one_change.cost };
        //         if (ERROR) logger.error('------------------------------------------------------');
        //         if (ERROR) logger.error(extraErrInfo.debug_info);
        //         if (ERROR) logger.error('------------------------------------------------------');
        //         cb && cb(ObjUtil.merge(extraErrInfo, ERROR_OBJ.PARAM_WRONG_TYPE));
        //         return;
        //     }
        //     temp_total = temp_total + gain - cost;
        // }

        let nickname = (account.nickname != null);

        if (total < 0) {
            // 报错返回, 不再更新数据库和内存
            cb && cb(ERROR_OBJ.NEGATIVE_GOLD_ERR);
            return;
        }

        _didAddGoldLog(pool, account, data, cb, current_total, nickname, true);

    }
}

function insert(pool, data, cb, gold_old) {
    const FUNC = TAG + "insert() --- ";

    let account_id = data['account_id'];
    let gain = data['gain'];
    let cost = data['cost'];
    let total = data['total'];
    let duration = data['duration'];
    let scene = data['scene'];
    let nickname = data['nickname'];
    let level = data['level'];
    
    if (total < 0) {
        logger.error(FUNC + '玩家金币总数不能为负');
        if (cb) cb(ERROR_OBJ.GOLD_NOT_ENOUGH);
        return;
    }
    if (gold_old != null && gold_old + gain - cost != total) {
        logger.error(FUNC + '玩家金币数量不匹配');
        if (cb) cb(ERROR_OBJ.GOLD_MISSMATCH);
        return;
    }
    
    let log_at = DateUtil.format(new Date(), "yyyy-MM-dd hh:mm:ss");
    
    let sql = '';
    sql += 'INSERT INTO `tbl_gold_log` ';
    sql += '(`account_id`, `log_at`, `gain`,`cost`,`total`,`duration`,`scene`, `nickname`, `level`) ';
    sql += 'VALUES ';
    sql += '(?,?,?,?,?,?,?,?,?)';
    
    let sql_data = [account_id, log_at, gain, cost, total, duration, scene, nickname, level];
    if (DEBUG) logger.info(FUNC + 'sql:', sql);
    if (DEBUG) logger.info(FUNC + 'sql_data:', sql_data);
    logger.info(FUNC + 'sql:', sql);
    logger.info(FUNC + 'sql_data:', sql_data);
    
    pool.query(sql, sql_data, function (err, result) {
        if (err) {
            if (ERROR) logger.error(FUNC + 'err:', err);
            if (cb) cb(err);
            return;
        }
        if (DEBUG) logger.info(FUNC + 'result:', result);
        if (cb) cb(err, result);
    });
}

// 验证后加入一条log
function _didAddGoldLog(pool, account, data, cb, current_total, nickname, isServer) {
    const FUNC = TAG + "_didAddGoldLog() --- ";
    let account_id = data['account_id'];
    let total = data['total'];
    let duration = data['duration'];
    let group = data['group'];
    let level = account.level;

    // if (account_id == 21) {
    //     let uid = account_id;
    //     // _didAddGoldLog() --- 21-玩家等级:
    //     logger.info(FUNC + uid + "-玩家等级:", account.level);
    // }
    

    let bonusList = [];
    
    // DONE: 将下面的数据库操作累积起来做统一处理
    // 1. 将log_at变为字符串进行存储

    let temp_total = current_total;
    let total_gain = 0;
    let total_cost = 0;
    let log_at = DateUtil.format(new Date(), "yyyy-MM-dd hh:mm:ss");
    for (let i = 0; i < group.length; i++) {
        let one_change = group[i];
        total_gain += one_change.gain;
        total_cost += one_change.cost;
        temp_total = temp_total + one_change.gain - one_change.cost;
        if (one_change.scene == common_log_const_cfg.GOLDFISH_GAIN) {
            bonusList.push(one_change.gain);
        }
        
        // 2. 将每一个log插入到gGoldLogCache变量中
        // 金币日志中剔除没有消耗也没有获得的客户端传来的伪数据.
        if (one_change.gain > 0 || one_change.cost > 0) {

            // 记录玩家异常数据.
            let rate = Math.round(account.gold / account.weapon);
            logger.info(FUNC + "account.gold:", account.gold);
            logger.info(FUNC + "account.weapon:", account.weapon);
            logger.info(FUNC + "rate:", rate);
            if (rate > 8000) {
                let data = {
                    uid: account_id,
                    type: 1,
                    log_at: log_at,
                    exception: "玩家金币异常---gold/weapon:" + rate,
                };
                CacheUserException.push(data);
            }

            logBuilder.addGoldLogEx({
                account_id: account_id,
                log_at: log_at,
                gain: one_change.gain,
                cost: one_change.cost,
                duration: duration,
                total: temp_total,
                scene: one_change.scene,
                nickname: nickname,
                level: level,
            });
        }
    }
    
    check(pool);

    // logger.info(FUNC + "=================++++==account_id:", data.account_id);
    _updateGoldTable(pool, account, data, cb, total_gain, total_cost, isServer);
    // 设置抽奖通告
    _setBroadcat(account, bonusList);
}

function _setBroadcat(account, bonusList) {
    const FUNC = TAG + "_setBroadcat() --- ";
    let player = ObjUtil.getPlayerName(account);
    for (let i = 0; i < bonusList.length; i++) {
        let oneBonus = bonusList[i];
        if (oneBonus > 500000) {
            let charm = account.charm_rank && parseInt(account.charm_rank) || 0;
            if (DEBUG) logger.info(FUNC + "****************设置抽奖通告******************");
            if (DEBUG) logger.info(FUNC + "charm_rank:", account.charm_rank);
            let content = {
                type: GameEventBroadcast.TYPE.GAME_EVENT.GOLDFISH_DRAW,
                params: [ player, oneBonus, account.vip,charm],
            };
            new GameEventBroadcast(content).extra(account).add();
        }
    }
}

// 更新tbl_gold表中的current_total, total_gain, total_cost字段
function _updateGoldTable(pool, account, data, cb, total_gain, total_cost, isServer) {
    const FUNC = TAG + "_updateGoldTable() --- ";

    let account_id = data['account_id'];
    let total = data['total'];
    let hitrate = data['hitrate'];
    
    let old_comeback = account['comeback'];
    if (old_comeback != null) {
        old_comeback = ObjUtil.str2Data(old_comeback);
        if (old_comeback.hitrate) {
            if (hitrate < old_comeback.hitrate) {
                old_comeback.hitrate = hitrate;
            }
        }
    }
    
    total = parseInt(total);

    if (total < 0) {
        logger.info(FUNC + "【ERROR】客户端传了一个负的金币总量, OMG!!!");
    }
    
    //--------------------------------------------------------------------------
    // 更新缓存中的数据(重要:数据库操作将会被删除)
    //--------------------------------------------------------------------------
    // 强制使用客户端上传的金币总量
    if (!isServer) {
        account.gold = (total_gain - total_cost);
    }
    account.gold_total_gain = account.gold_total_gain + total_gain;
    account.gold_total_cost = account.gold_total_cost + total_cost;
    account.comeback = old_comeback;
    account.commit();

    let result = [{}];
    result[0].online_time = 0;
    result[0].pump_water = Global.pumpWater();
    cb && cb(null, result);
}

/**
 * 获取当前玩家当日在线的总时间.
 */
function getOnlineTime(pool, data, cb) {
    const FUNC = TAG + "getOnlineTime() --- ";

    let account_id = data['account_id'];
    let token = data['token'];
    // 验证用户有效性
    DaoCommon.checkAccount(pool, token, function (error) {
        if (error) {
            cb(error);
            return;
        }
        
        _didGetOnlineTime(pool, data, cb);
    });
}

//=======================================================================================
// private
//=======================================================================================

/**
 * 插入大量的日志数据.
 * @param group 插入数据的来源(队列)
 * @param num 插入数据的数目
 */
function insertMassive(pool, group, num, cb) {
    const FUNC = TAG + "insertMassive() --- ";

    logger.info(FUNC + "CALL...");
    
    if (group.length > 0) {
        
        let sql = '';
        sql += 'INSERT INTO `tbl_gold_log` ';
        sql += '(`account_id`,`log_at`,`gain`,`cost`,`total`,`duration`,`scene`, `nickname`, `level`) ';
        sql += 'VALUES ';
        sql += '(?,?,?,?,?,?,?,?,?)';
        if (group.length > 1) {
            for (let i = 0; i < group.length - 1; i++) {
                sql += ',(?,?,?,?,?,?,?,?,?)';
            }
        }
        
        let sql_data = [];
        for (let i = 0; i < num; i++) {
            let record = group.shift();
            
            sql_data.push(record.account_id);
            sql_data.push(record.log_at);
            sql_data.push(record.gain);
            sql_data.push(record.cost);
            sql_data.push(record.total);
            sql_data.push(record.duration);
            sql_data.push(record.scene);
            sql_data.push(record.nickname);
            sql_data.push(record.level);
        }
        
        if (DEBUG) logger.info(FUNC + 'sql(' + sql.length + '):\n', sql);
        if (DEBUG) logger.info(FUNC + 'sql_data(' + sql_data.length + '):\n', sql_data);
        
        pool.query(sql, sql_data, function (err, result) {
            if (err) {
                logger.error(FUNC + 'err:', err);
                cb && cb(err);
            }
            cb && cb(null, result);
        });

    }
    else {
        cb && cb(ERROR_OBJ.CACHE_EMPTY);
    }
}


/**
 * 插入大量的日志数据(用户异常).
 * @param group 插入数据的来源(队列)
 * @param num 插入数据的数目
 */
function insertMassiveUserException(pool, group, num, cb) {
    const FUNC = TAG + "insertMassiveUserException() --- ";

    logger.info(FUNC + "CALL...");
    
    if (group.length > 0) {
        
        let sql = '';
        sql += 'INSERT INTO `tbl_user_exception` ';
        sql += '(`uid`,`log_at`,`type`, `exception`) ';
        sql += 'VALUES ';
        sql += '(?,?,?,?)';
        if (group.length > 1) {
            for (let i = 0; i < group.length - 1; i++) {
                sql += ',(?,?,?,?)';
            }
        }
        
        let sql_data = [];
        for (let i = 0; i < num; i++) {
            let record = group.shift();
            
            sql_data.push(record.uid);
            sql_data.push(record.log_at);
            sql_data.push(record.type);
            sql_data.push(record.exception);
        }
        
        if (DEBUG) logger.info(FUNC + 'sql(' + sql.length + '):\n', sql);
        if (DEBUG) logger.info(FUNC + 'sql_data(' + sql_data.length + '):\n', sql_data);
        
        pool.query(sql, sql_data, function (err, result) {
            if (err) {
                logger.error(FUNC + 'err:', err);
                logger.info(FUNC + 'sql(' + sql.length + '):\n', sql);
                logger.info(FUNC + 'sql_data(' + sql_data.length + '):\n', sql_data);
                cb && cb(err);
            }
            cb && cb(null, result);
        });

    }
    else {
        cb && cb(ERROR_OBJ.CACHE_EMPTY);
    }
}


/**
 * 增加金币数据log的准备工作, 准备好了返回true, 出现任何问题返回false.
 */
function _prepare(data, cb) {
    const FUNC = TAG + "_prepare() --- ";
    
    let account_id = data['account_id'];
    let token = data['token'];
    let total = data['total'];
    let duration = data['duration'];
    let group = data['group'];
    
    if (!_isParamExist(account_id, "接口调用请传参数account_id(玩家ID)", cb)) return false;
    if (!_isParamExist(token, "接口调用请传参数token", cb)) return false;
    if (!_isParamExist(duration, "接口调用请传参数duration(距上一次调用此接口间隔的时间，单位毫秒)", cb)) return false;
    if (!_isParamExist(total, "接口调用请传参数total(玩家当前持有的金币数)", cb)) return false;
    if (!_isParamExist(group, "接口调用请传参数group(数组，玩家结算的一组数据，先存于客户端，再在统一时刻一起上传)", cb)) return false;

    if (group.length == 0) {
        cb && cb(null, { msg: "空数组不处理" });
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
        logger.error(extraErrInfo.debug_info);
        cb(ObjUtil.merge(extraErrInfo, ERROR_OBJ.PARAM_MISSING));
        return false;
    }
    return true;
}

// 获取在线时间的实现
function _didGetOnlineTime(pool, data, cb) {
    const FUNC = TAG + "_didGetOnlineTime() --- ";

    // let account_id = data['account_id'];
    
    // let sql = '';
    // sql += 'SELECT SUM(`duration`) AS online_time ';
    // sql += 'FROM `tbl_gold_log` ';
    // sql += 'WHERE `account_id`=? AND TO_DAYS(`log_at`)=TO_DAYS(NOW())';
    
    // let sql_data = [account_id];

    // if (DEBUG) logger.info(FUNC + 'sql:', sql);
    // if (DEBUG) logger.info(FUNC + 'sql_data:', sql_data);
    
    // pool.query(sql, sql_data, function (err, result) {
    //     if (err) {
    //         if (ERROR) logger.error(FUNC + 'err:', err);
    //         cb(err);
    //     } else {
    //         if (DEBUG) logger.info(FUNC + 'result:', result);
    //         if (result[0].online_time == null) {
    //             result[0].online_time = 0;
    //         }
    //         result[0].pump_water = Global.pumpWater();
    //         cb(null, result);
    //     }
    // });

    // TODO: 特别注意! 需要从缓存中计算在线时间

    cb(null, [{online_time:1000}]);
}