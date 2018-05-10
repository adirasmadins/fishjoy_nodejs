const BuzzUtil = require('../utils/BuzzUtil');
const ObjUtil = require('../buzz/ObjUtil');
const DateUtil = require('../utils/DateUtil');
const ArrayUtil = require('../utils/ArrayUtil');
const CstError = require('../../../../consts/fish_error');
const buzz_cst_game = require('../buzz/cst/buzz_cst_game');
const CacheGold = require('../buzz/cache/CacheGold');
const CacheAccount = require('../buzz/cache/CacheAccount');
const CacheUserException = require('../buzz/cache/CacheUserException');
const common_log_const_cfg = require('../../../../utils/imports').DESIGN_CFG.common_log_const_cfg;
const ERROR_OBJ = CstError.ERROR_OBJ;
const GameEventBroadcast = require('../../../../common/broadcast/GameEventBroadcast');

let DEBUG = 0;
let ERROR = 1;

const TAG = "【dao_gold】";
exports.writeUserException = writeUserException;
exports.getOnlineTime = getOnlineTime;


function writeUserException(pool, cb) {
    let count = CacheUserException.length();
    if (count > 0) {
        insertMassiveUserException(pool, CacheUserException.cache(), count, cb);
    }
    else {
        cb && cb(ERROR_OBJ.CACHE_EMPTY);
    }
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






/** 服务器更新金币日志专用. */
function addGoldLogCache(data, cb) {
    const FUNC = TAG + "addGoldLog() --- ";

    let account_id = data['account_id'];
    let token = data['token'];
    let total = data['total'];
    let duration = data['duration'];
    let group = data['group'];

    if (!_prepare(data, cb)) return;
    BuzzUtil.cacheLinkDataApi(data, "add_gold_log");

    if (total < 0) {
        if (ERROR) logger.error('------------------------------------------------------');
        if (ERROR) logger.error(FUNC + '玩家金币总数不能为负');
        if (ERROR) logger.error('------------------------------------------------------');
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


// 验证后加入一条log
function _didAddGoldLog(pool, account, data, cb, current_total, nickname, isServer) {
    const FUNC = TAG + "_didAddGoldLog() --- ";
    let account_id = data['account_id'];
    let total = data['total'];
    let duration = data['duration'];
    let group = data['group'];
    let level = account.level;
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
                if (ERROR) logger.error('------------------------------------------------------');
                if (ERROR) logger.error(FUNC + 'err:', err);
                if (ERROR) logger.error('------------------------------------------------------');
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
            if (err && ERROR) {
                logger.error('------------------------------------------------------');
                logger.error(FUNC + 'err:', err);
                logger.info(FUNC + 'sql(' + sql.length + '):\n', sql);
                logger.info(FUNC + 'sql_data(' + sql_data.length + '):\n', sql_data);
                logger.error('------------------------------------------------------');
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
    
    let total = data['total'];

    if (!_isParamExist(total, "接口调用请传参数total(玩家当前持有的金币数)", cb)) return false;
    
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