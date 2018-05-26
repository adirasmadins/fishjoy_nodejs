const utils = require('../buzz/utils');
const CacheAccount = require('../buzz/cache/CacheAccount');
const DaoCommon = require('./dao_common');
const CstError = require('../../../../consts/fish_error');
const gameConfig = require('../../../../utils/imports').DESIGN_CFG;
const vip_vip_cfg = gameConfig.vip_vip_cfg;
const account_def = require('../../../../models/index').KEYTYPEDEF;

let DEBUG = 0;
let ERROR = 1;

const TAG = "【dao_account】";

exports.channelLogin = channelLogin;
exports.createSessionToken = _createSessionToken;
exports.logout = _logout;
exports.getDayReward = _getDayReward;
exports.getBankruptcyCompensation = _getBankruptcyCompensation;
exports.token4DailyReset = token4DailyReset;

/**
 * 更新token, 返回玩家数据
 */
function token4DailyReset(pool, data, cb) {
    const FUNC = TAG + "token4DailyReset() --- ";

    let uid = data['uid'];
    if (uid == null || uid == "") {
        cb(new Error("用户id(uid)不能为空!"));
        return;
    }

    _createSessionToken(pool, uid, function(err, results) {
        cb(err, results);
        // 更新缓存中的first_login
        if (CacheAccount.contains(uid)) {
            CacheAccount.setFirstLogin(uid, 0);
        }
        // 数据库中的first_login也需要重置
        setFirstLogin(pool, uid, 0, function(err, result) {
            // DO NOTHING
        });
    });
}

function setFirstLogin(pool, uid, first_login, cb) {
    const FUNC = TAG + "setFirstLogin() --- ";
    let sql = "";
    sql += "UPDATE `tbl_account` ";
    sql += "SET `first_login`=? ";
    sql += "WHERE `id`=? ";

    let sql_data = [first_login, uid];

    pool.query(sql, sql_data, function (err, result) {
        if (err) {
            if (ERROR) logger.error("err:", err);
            cb(err);
            return;
        }
        if (cb) cb();
    });
}

//------------------------------------------------------------------------------
// 用于统计玩家点击按钮次数.
/**
 * 渠道点击按钮记录.
 */
function channelLogin(pool, data, cb) {
    const FUNC = TAG + "channelLogin() --- ";

    let channel_uid = data.channel_uid;

    let sql = "";
    sql += "SELECT * ";
    sql += "FROM tbl_channel_create ";
    sql += "WHERE channel_uid=? ";
    let sql_data = [channel_uid];

    pool.query(sql, sql_data, function (err, rows) {
        if (err) {
            if (ERROR) logger.error("查询渠道点击信息出错====err:", err);
            cb(err);
            return;
        }
        if (rows.length == 0) {
            if (DEBUG) logger.info("需要创建一条tbl_account_create数据并返回insertId");
            _insertChannelCreate(pool, channel_uid, function (err, insertId) {
                _insertChannelLogin(pool, insertId, cb);
            });
        }
        else {
            if (DEBUG) logger.info("直接使用id进行插入");
            let channel_user = rows[0];
            _insertChannelLogin(pool, channel_user.id, cb);
        }
    });
}

/**
 * 插入一条数据到tbl_channel_create
 */
function _insertChannelCreate(pool, channel_uid, cb) {
    const FUNC = TAG + "_insertChannelCreate() --- ";

    let sql = "";
    sql += "INSERT INTO tbl_channel_create ";
    sql += "(channel_uid) ";
    sql += "VALUE (?)";
    let sql_data = [channel_uid];

    pool.query(sql, sql_data, function (err, rows) {
        if (err) {
            if (ERROR) logger.error(FUNC + "插入渠道用户首次点击记录失败====err:", err);
            cb(err);
            return;
        }
        cb(null, rows.insertId);
    });
}

/**
 * 插入一条数据到tbl_channel_login
 */
function _insertChannelLogin(pool, channel_create_id, cb) {
    const FUNC = TAG + "_insertChannelLogin() --- ";

    let sql = "";
    sql += "INSERT INTO tbl_channel_login ";
    sql += "(channel_create_id) ";
    sql += "VALUE (?)";
    let sql_data = [channel_create_id];

    pool.query(sql, sql_data, function (err, rows) {
        if (err) {
            if (ERROR) logger.error(FUNC + "插入渠道用户点击记录失败====err:", err);
            cb(err);
            return;
        }
        logger.info("insertId:", rows.insertId);
        _updateChannelCreate(pool, channel_create_id, function(err, result) {
            cb(err, result);
        });
    });
}

/**
 * 更新渠道用户总点击次数.
 */
function _updateChannelCreate(pool, channel_create_id, cb) {
    const FUNC = TAG + "_insertChannelLogin() --- ";

    let sql = "";
    sql += "UPDATE `tbl_channel_create` ";
    sql += "SET `count`=`count`+1 ";
    sql += "WHERE `id`=? ";
    let sql_data = [channel_create_id];

    pool.query(sql, sql_data, function (err, rows) {
        if (err) {
            if (ERROR) logger.error(FUNC + "更新渠道用户总点击次数失败====err:", err);
            cb(err);
            return;
        }
        cb(null, "success");
    });
}

/**
 * TODO: 记录登出日志, 需要使用缓存机制
 */
function _addLogoutLog(pool, id, nickname) {
    
    let sql = '';
    sql += 'INSERT INTO `tbl_logout_log` ';
    sql += 'SET `account_id`=?, `nickname`=? ';
    
    let sql_data = [id, nickname];
    
    pool.query(sql, sql_data, function (err, result) {
        if (err) {
            // Do nothing but log the error
            logger.info('call function _addLogoutLog');
            logger.info(err);
            return;
        }
    });
}

function _createSessionToken(pool, uid, cb) {
    let token = utils.generateSessionToken(uid);
    CacheAccount.getAccountFieldById(uid, [account_def.TOKEN], function (err, account) {
        account.token = token;
        cb(null, [account.toJSON()]);
    });
}

function _logout(pool, data, cb) {
    let id = data.account_id;
    let token = data.token;
    cb(null, { status: 1, msg: "成功退出" });
    return;
}

/**
 * 获取每日登录奖励, 需要主动获取(点击"领取"按钮).
 */
function _getDayReward(pool, data, cb) {
    const FUNC = TAG + "_getDayReward() --- ";
    let id = data['account_id'];
    let token = data['token'];
    
    // 需要验证当前字段day_reward是否为0, 为0应该提示"不能重复领取每日签到奖励"

    let sql = '';
    sql += 'SELECT `id`, `day_reward`, `day_reward_weekly` ';
    sql += 'FROM `tbl_account` ';
    sql += 'WHERE `id`=? AND `token`=?';
    logger.info('sql: ' + sql);

    let sql_data = [id, token];

    pool.query(sql, sql_data, function (err, results) {
        if (err) {
            logger.error(FUNC + "err:\n", err);
            logger.error(FUNC + "sql:\n", sql);
            logger.error(FUNC + "sql_data:\n", sql_data);
            cb(err);
            return;
        }
        let err_info = null;
        if (results == null) {
            err_info = '查询结果为空';
            cb(new Error(err_info));
            return;
        }
        if (results.length == 0) {
            logger.error('TOKEN_INVALID: dao_account._getDayReward()');
            cb(CstError.ERROR_OBJ.TOKEN_INVALID);
            return;
        }
        let record = results[0];
        if (record.day_reward == 0) {
            err_info = '今日已领，不能重复领取每日签到奖励';
            cb(new Error(err_info));
            return;
        }
        _didGetDayReward(pool, data, cb);
    });
}

function _didGetDayReward(pool, data, cb) {
    const FUNC = TAG + "_didGetDayReward() --- ";
    let account_id = data['account_id'];
    let token = data['token'];
    
    
    //--------------------------------------------------------------------------
    // 更新缓存中的数据(重要:数据库操作将会被删除)
    //--------------------------------------------------------------------------
    CacheAccount.setDayReward(account_id, 0);
    CacheAccount.addDayRewardWeekly(account_id, 1);
    //--------------------------------------------------------------------------
    
    let sql = '';
    sql += 'UPDATE `tbl_account` ';
    sql += 'SET `day_reward`=0, `day_reward_weekly`=`day_reward_weekly`+1 ';
    sql += 'WHERE `id`=? AND `token`=?';
    logger.info('sql: ' + sql);
    
    let sql_data = [account_id, token];
    
    pool.query(sql, sql_data, function (err) {
        if (err) {
            logger.error(FUNC + "err:\n", err);
            logger.error(FUNC + "sql:\n", sql);
            logger.error(FUNC + "sql_data:\n", sql_data);
            cb(err);
            return;
        }
        cb(null, { status: 1, msg: '领取成功', data: 1 });
    });
}

function _getVipInfo(vip_level) {
    for (let idx in vip_vip_cfg) {
        logger.info('vip_level: ', vip_level);
        logger.info('cfg::vip_level: ', vip_vip_cfg[idx].vip_level);
        if (vip_vip_cfg[idx].vip_level == vip_level) {
            return vip_vip_cfg[idx];
        }
    }
}

/**
 * 破产领取，领取后将tbl_account中的broke_times加1并返回当前数据(破产获取的金币由_addGoldLog进行更新).
 * 先验证再更新.
 */
function _getBankruptcyCompensation(pool, data, cb) {
    const FUNC = TAG + "_getBankruptcyCompensation() --- ";
    let uid = data.account_id;
    let token = data.token;

    if (uid == null || uid == "") {
        cb(new Error("account_id字段不能为空!"));
        return;
    }
    if (token == null || token == "") {
        cb(new Error("token字段不能为空!"));
        return;
    }

    DaoCommon.checkAccount(pool, token, function(error, account) {
        if (error) {
            cb(error);
            return;
        }
        doNextWithAccount(account);
    });

    function doNextWithAccount(account) {
        // let record = results_account[0];
        // 修改: 不同VIP等级每日补偿领取的次数不同, 需要计数领取次数, 然后和配置中的数据对比进行判断
        // vip_vip_cfg[vip].vip_alms_times
        let vip = account.vip;
        let vipInfo = _getVipInfo(vip);
        let vip_alms_value = 0;
        if (DEBUG) logger.info(FUNC + 'vipInfo: ', vipInfo);
        if (vipInfo) {
            let vip_alms_times = vipInfo.vip_alms_times;
            let vip_alms_value = vipInfo.vip_alms_value;

            if (DEBUG) logger.info(FUNC + 'account.broke_times: ', account.broke_times);
            if (DEBUG) logger.info(FUNC + 'vip_alms_times: ', vip_alms_times);

            if (account.broke_times >= vip_alms_times) {
                if (ERROR) logger.info(FUNC + '【ERROR】今日的破产补偿已经领取完毕，明天再来吧');
                cb(new Error('今日的破产补偿已经领取完毕，明天再来吧'));
                return;
            }
        }
        else {
            // TODO: 没有查找到VIP玩家信息的处理
        }
        
        // 玩家领取救济金数量获取
        
        //--------------------------------------------------------------------------
        // 更新缓存中的数据(重要:数据库操作将会被删除)
        //--------------------------------------------------------------------------
        CacheAccount.costBrokeTimes(uid);
        // CacheAccount.setGold(uid, vip_alms_value);
        let cur = vip_alms_value - account.gold;
        account.gold = cur;
        account.commit();
        //--------------------------------------------------------------------------
        cb(null, [{gold: vip_alms_value}]);
    }
}