const _ = require('underscore');
const utils = require('../../buzz/utils');
const ObjUtil = require('../../buzz/ObjUtil');
const DateUtil = require('../../utils/DateUtil');
const PlayerModel = require('../../../../../models/keyTypeDef').PlayerModel;
const redisAccountSync = require('../../../../../utils/redisAccountSync');
const buzz_cst_error = require('../../../../../consts/fish_error');

const gameConfig = require('../../../../../utils/imports').DESIGN_CFG;
const player_users_cfg = gameConfig.player_users_cfg;
const init_pearl = player_users_cfg[0]['pearl'];
const CacheAccount = require('../../buzz/cache/CacheAccount');
const async = require('async');
const ERROR_OBJ = buzz_cst_error.ERROR_OBJ;


const TAG = "【dao/account/common】";

exports.init = init;

exports.getAccountById = getAccountById;
exports.getAccountByUid = getAccountByUid;
exports.getAccountByToken = getAccountByToken;
exports.checkNickname = checkNickname;
exports.isCardValid = isCardValid;

exports.getGuideWeakInit = getGuideWeakInit;

exports.getTokenByUid = getTokenByUid;

exports.updateCardData = updateCardData;
exports.updateLoginCount = updateLoginCount;//TODO
exports.accountCharmOpt = accountCharmOpt;

//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------
/**
 * 创建账号后对账号的相关信息进行初始化(金币，钻石，临时用户名...)
 * @param pool 数据库池
 * @param id 用户ID
 * @param cb 回调函数, 用于处理获取的数据
 */
function init(pool, id, cb) {
    logger.info('init() - id: ' + id);
    _addRecordToGoldTable(pool, id, cb);
}

/**
 * 根据用户的ID获取用户信息
 * @param pool 数据库池
 * @param id 用户ID
 * @param cb 回调函数, 用于处理获取的数据
 */
function getAccountById(pool, id, cb) {
    const FUNC = TAG + "getAccountById() --- ";
    logger.info(FUNC + "CAll...");
    logger.info(FUNC + 'id: ' + id);
    let sql = _resultList();
    sql += 'WHERE a.`id`=? ';
    let sql_data = [id];
    async.waterfall(
        [
            function (cb) {
                _queryAccount(pool, sql, sql_data, cb);
            }
            , function (account, cb) {
                logger.info(FUNC + "1.account.id:", account.id);
                cb(null, transformSql2Redis(account));
            }
            , function (account, cb) {
                if (!account.nickname || account.nickname == "") {
                    account.nickname = account.channel_account_name;
                }
                if (!account.nickname || account.nickname == "") {
                    account.nickname = account.tempname;
                }
                logger.info(FUNC + "2.account.id:", account.id);
                redisAccountSync.setAccount(id, account, cb);
            }
            , function (res, cb) {
                redisAccountSync.getAccount(id, cb);
            }
        ], function (err, account) {
            if (err) logger.error(FUNC + 'err: ', err);
            logger.info(FUNC + '3.account.id: ', account.id);
            cb && cb(err, account);
        }
    );
}

/**
 * 仅返回一个用户数据.
 */
function getAccountByUid(pool, id, cb) {
    const FUNC = TAG + "getAccountByUid() --- ";
    logger.info(FUNC + "CAll...");
    getAccountById(pool, id, function (err, results) {
        if (err) {
            logger.error(FUNC + "err:\n", err);
            cb(ERROR_OBJ.DATA_NULL_ERROR);
            return;
        }
        if (!results) {
            logger.error(FUNC + "results为空");
            cb(ERROR_OBJ.DATA_NULL_ERROR);
            return;
        }
        if (results.length > 0) {
            let data = results[0];
            async.waterfall([function (cb) {
                CacheAccount.setAccountById(data.id, data, cb);
            }, function (result, cb) {
                CacheAccount.getAccountById(data.id, cb);
            }, function (account, _cb) {
                cb(err, account);
                _cb();
            }]);
        }
        else {
            cb(err, null);
        }
    });
}

/**
 * 根据用户的Token获取用户信息
 * @param pool 数据库池
 * @param token 用户Token
 * @param cb 回调函数, 用于处理获取的数据
 */
function getAccountByToken(pool, token, cb) {
    const FUNC = TAG + "getAccountByToken() --- ";
    logger.info(FUNC + "CAll...");
    //
    //------------------------------------------------------

    logger.info(FUNC + 'token: ' + token);
    if (token == "daily_reset") {
        logger.error(FUNC + "服务器跨天更新token");
        cb(ERROR_OBJ.DAILY_RESET);// 1013
        
        return;
    }
    else if (token == "server_update") {
        logger.error(FUNC + "服务器更新重启");
        cb(ERROR_OBJ.SERVER_UPDATE);// 1012
        
        return;
    }


    // 从token获取到uid, 从uid获取当前token
    let uid = token.split("_")[0];
    logger.info(FUNC + 'uid: ' + uid);
    getTokenByUid(uid, function (err, db_token) {
        if (err) {
            cb(err);
            return;
        }
        logger.info(FUNC + 'db_token: ' + db_token);
        if (token == db_token) {
            redisAccountSync.getAccount(uid, function (err, account) {
                if (account) {
                    cb(null, [account]);
                }
                else {
                    let sql = _resultList();
                    // sql += 'WHERE a.`token`=? ';
                    // let sql_data = [token];
                    sql += 'WHERE a.`id`=? ';
                    let sql_data = [uid];
                    _queryAccount(pool, sql, sql_data, cb);
                    
                }
            });
        }
        else {
            logger.error(FUNC + "token与客户端不匹配");
            if (db_token == "daily_reset") {
                logger.error(FUNC + "服务器跨天更新token");
                cb(ERROR_OBJ.DAILY_RESET);// 1013
                
                return;
            }
            else if (db_token == "server_update") {
                logger.error(FUNC + "服务器更新重启");
                cb(ERROR_OBJ.SERVER_UPDATE);// 1012
                
                return;
            }
            else {
                logger.error(FUNC + "玩家账号在其他地方登录");
                cb(ERROR_OBJ.TOKEN_INVALID);//1011
                
                return;
            }
        }
    });
}

/**
 * 根据用户ID获取token.
 */
function getTokenByUid(uid, cb) {
    const FUNC = TAG + "getTokenByUid() --- ";
    redisAccountSync.getAccount(uid, ['token'], function (err, account) {
        if (account) {
            cb && cb(null, account.token);
        }
        else {
            let sql = "";
            sql += "SELECT id, token ";
            sql += "FROM tbl_account ";
            sql += "WHERE `id`=? ";
            let sql_data = [uid];

            mysqlConnector.query(sql, sql_data, function (err, results) {
                if (err) {
                    cb(err);
                    return;
                }
                if (results.length == 0) {
                    logger.error(FUNC + "没有查找到对应的用户, uid:", uid);
                    let ret_error_obj = {
                        code: ERROR_OBJ.UID_CANNOT_FIND.code,
                        msg: ERROR_OBJ.UID_CANNOT_FIND.msg + " uid:" + uid,
                    };
                    cb(ret_error_obj);
                    return;
                }
                cb(err, results[0].token);
            });
        }

    });
}

function _queryAccount(pool, sql, sql_data, cb) {
    const FUNC = TAG + "_queryAccount() --- ";
    logger.info(FUNC + "CAll...");
    logger.info(FUNC + "sql:", sql);
    logger.info(FUNC + "uid:", sql_data);
    // let sql1 = 'SELECT * FROM tbl_account WHERE id=?'
    pool.query(sql, sql_data, function (err, results) {
        if (err) {
            logger.error(FUNC + "err:\n", err);
            logger.error(FUNC + "results:\n", results);
            cb && cb(err);
            return;
        }

        if (results != null && results.length > 0) {
            let account = results[0];
            cb(null, account);
        } else {
            cb && cb(ERROR_OBJ.ACCOUNT_NOT_REGIST);
        }
    });
}

//从缓存中取出魅力参数,注意老玩家的好友数量
function accountCharmOpt(account_in_cache, cb) {
    CacheAccount.resetCharmPoint(account_in_cache, function (cps) {
        if (cps && cps.length == 2) {
            account_in_cache.charm_point = cps[0];
            account_in_cache.charm_rank = cps[1];
        }
        cb && cb(null, [account_in_cache]);
    });
}

/**
 * 检测昵称是否存在
 * @param pool 数据库池
 * @param nickname 待检测的昵称
 * @param cb 回调函数, 用于处理获取的数据
 */
function checkNickname(pool, nickname, cb) {
    let sql = '';
    sql += 'SELECT * ';
    sql += 'FROM `tbl_account`';
    sql += ' WHERE `nickname`=?';
    let sql_data = [nickname];

    logger.info('sql:', sql);
    logger.info('sql_data:', sql_data);

    pool.query(sql, sql_data, function (err, results) {
        cb(err, results);
    });
}

/**
 * 当前月卡是否有效
 * @param card_type 月卡类型，取值为normal
 */
function isCardValid(card, card_type) {
    if (card[card_type]) {
        let buy_date = card[card_type]['start_date'];
        let cur_date = DateUtil.format(new Date(), "yyyy-MM-dd");
        let offDate = DateUtil.dateDiff(cur_date, buy_date);

        logger.info("购买日期: " + buy_date);
        logger.info("当前日期: " + cur_date);
        logger.info("距离购买日过去天数: " + offDate);

        return offDate < 30;
    }
}

/**
 * 获取弱引导初始值.
 */
function getGuideWeakInit() {
    let init = {
        "laser": false,
        "achieve": false,
        "reward": false,
        "petfish": false,
        "goddess": false,
        "laserTimes": 3,
        "specials": {}
    };
    return ObjUtil.data2String(init);
}


//==============================================================================
// private
//==============================================================================
// 获取返回值列表
function _resultList() {
    let sql = '';
    sql += 'SELECT ';
    sql += 'a.`id`, ';
    sql += 'a.`jointype`, ';
    sql += 'a.`who_invite_me`, ';
    sql += 'a.`who_share_me`, ';
    sql += 'a.`updated_at`, ';
    sql += 'a.`tempname`, ';
    sql += 'a.`nickname`, ';
    sql += 'a.`channel`, ';
    sql += 'a.`channel_account_name`, ';
    sql += 'a.`channel_account_id`, ';
    sql += 'a.`channel_account_info`, ';
    sql += 'a.`created_at`, ';
    sql += 'a.`pfft_at`, ';
    sql += 'a.`login_count`, ';
    sql += 'a.`logout_count`, ';
    sql += 'a.`salt`, ';
    sql += 'a.`token`, ';
    sql += 'a.`password`, ';
    sql += 'a.`charm_rank`, ';
    sql += 'a.`charm_point`, ';
    sql += 'a.`vip`, ';
    sql += 'a.`rmb`, ';
    sql += 'a.`exp`, ';
    sql += 'a.`level`, ';
    sql += 'a.`gold`, ';
    sql += 'a.`pearl`, ';
    sql += 'a.`weapon`, ';
    sql += 'a.`weapon_energy`, ';
    sql += 'a.`vip_weapon_id`, ';
    sql += 'a.`skill`, ';
    sql += 'a.`broke_times`, ';
    sql += 'a.`day_reward`, ';
    sql += 'a.`day_reward_adv`, ';
    sql += 'a.`new_reward_adv`, ';
    sql += 'a.`day_reward_weekly`, ';
    sql += 'a.`vip_daily_fill`, ';
    sql += 'a.`level_mission`, ';
    sql += 'a.`mission_daily_reset`, ';
    sql += 'a.`mission_only_once`, ';
    sql += 'a.`first_buy`, ';
    sql += 'a.`first_buy_gift`, ';
    sql += 'a.`activity_gift`, ';
    sql += 'a.`heartbeat`, ';
    sql += 'a.`heartbeat_min_cost`, ';
    sql += 'a.`achieve_point`, ';
    sql += 'a.`gold_shopping`, ';
    sql += 'a.`weapon_skin`, ';
    sql += 'a.`bonus`, ';
    sql += 'a.`drop_reset`, ';
    sql += 'a.`drop_once`, ';
    sql += 'a.`comeback`, ';
    sql += 'a.`vip_gift`, ';
    sql += 'a.`pirate`, ';
    sql += 'a.`card`, ';
    sql += 'a.`get_card`, ';
    sql += 'a.`package`, ';
    sql += 'a.`guide`, ';
    sql += 'a.`guide_weak`, ';
    sql += 'a.`active`, ';
    sql += 'a.`active_daily_reset`, ';
    sql += 'a.`active_stat_once`, ';
    sql += 'a.`active_stat_reset`, ';
    sql += 'a.`free_draw`, ';
    sql += 'a.`total_draw`, ';
    sql += 'a.`mail_box`, ';
    sql += 'a.`roipct_time`, ';
    sql += 'a.`goddess`, ';
    sql += 'a.`free_goddess`, ';
    sql += 'a.`goddess_free`, ';
    sql += 'a.`goddess_ctimes`, ';
    sql += 'a.`goddess_crossover`, ';
    sql += 'a.`goddess_ongoing`, ';
    sql += 'a.`redress_no`, ';
    sql += 'a.`first_login`, ';
    sql += 'a.`aquarium`, ';
    sql += 'a.`platform`, ';
    sql += 'a.`test`, ';
    sql += 'a.`figure`, ';
    sql += 'a.`rank_in_friends`, ';
    sql += 'a.`over_me_friends`, ';
    sql += 'a.`last_online_time`, ';
    sql += 'a.`sex`, ';
    sql += 'a.`city`, ';

    // sql += 'i.`web_url` AS figure_url, ';
    sql += "i.`web_url` AS figure_url, ";

    sql += 'asign.`month_sign` AS month_sign, ';
    sql += 'server.`sid` AS sid, ';

    sql += 's.`match_on` AS match_on, ';
    sql += 's.`cik_on` AS cik_on, ';
    sql += 's.`cdkey_on` AS cdkey_on, ';
    sql += 's.`msgboard_mgmt` AS msgboard_mgmt, ';

    sql += 'g.`max_wave` AS max_wave, ';
    sql += 'g.`updated_at` AS goddess_balance_time, ';
    sql += 'g.`week_reward` AS week_reward, ';
    sql += 'g.`week_rank` AS week_rank ';

    sql += ',aq.`updated_at` AS petfish_recent_time ';
    sql += ',aq.`total_level` AS petfish_total_level ';

    sql += ',r.`updated_at` AS match_recent_time ';
    sql += ',r.`win` AS match_win ';
    sql += ',r.`fail` AS match_fail ';
    sql += ',r.`points` AS match_points ';
    sql += ',r.`rank` AS match_rank ';
    sql += ',r.`unfinish` AS match_unfinish ';
    sql += ',r.`box` AS match_box_list ';
    sql += ',r.`box_timestamp` AS match_box_timestamp ';
    sql += ',r.`first_box` AS match_1st_box ';
    sql += ',r.`season_count` AS match_season_count ';
    sql += ',r.`season_win` AS match_season_win ';
    sql += ',r.`season_box` AS match_season_box ';
    sql += ',r.`season_first_win` AS match_season_1st_win ';
    sql += ',r.`is_season_reward` AS match_got_season_reward ';
    sql += ',r.`winning_streak` AS match_winning_streak ';

    sql += ',gold.`total_gain` AS gold_total_gain ';
    sql += ',gold.`total_cost` AS gold_total_cost ';
    sql += ',gold.`shop_count` AS gold_shop_count ';
    sql += ',gold.`shop_amount` AS gold_shop_amount ';

    sql += ',diamond.`total_gain` AS diamond_total_gain ';
    sql += ',diamond.`total_cost` AS diamond_total_cost ';
    sql += ',diamond.`shop_count` AS diamond_shop_count ';
    sql += ',diamond.`shop_amount` AS diamond_shop_amount ';

    sql += ',social.`id` AS has_social ';
    sql += ',social.`invite_friends` AS social_invite_friends ';
    sql += ',social.`share_friends` AS social_share_friends ';
    sql += ',social.`invite_progress` AS social_invite_progress ';
    sql += ',social.`invite_reward` AS social_invite_reward ';
    sql += ',social.`share_status_0` AS social_share_status_0 ';
    sql += ',social.`share_status_1` AS social_share_status_1 ';
    sql += ',social.`share_status_2` AS social_share_status_2 ';
    sql += ',social.`enshrine_status` AS social_enshrine_status';
    sql += ',social.`share_top_gold` AS social_share_top_gold ';
    sql += ',social.`share_top_rank` AS social_share_top_rank ';

    // 左连接查询
    sql += 'FROM `tbl_account` a ';
    sql += 'LEFT JOIN `tbl_account_sign` asign ON a.id=asign.id ';
    sql += 'LEFT JOIN `tbl_account_server` server ON a.id=server.uid ';
    sql += 'LEFT JOIN `tbl_img` i ON a.figure=i.id ';
    sql += 'LEFT JOIN `tbl_switch` s ON a.id=s.id ';
    sql += 'LEFT JOIN `tbl_goddess` g ON a.id=g.id ';
    sql += 'LEFT JOIN `tbl_aquarium` aq ON a.id=aq.id ';
    sql += 'LEFT JOIN `tbl_rankgame` r ON a.id=r.id ';
    sql += 'LEFT JOIN `tbl_gold` gold ON a.id=gold.account_id ';
    sql += 'LEFT JOIN `tbl_pearl` diamond ON a.id=diamond.account_id ';
    sql += 'LEFT JOIN `tbl_social` social ON a.id=social.id ';
    return sql;
}

function updateCardData(account, cb) {
    const FUNC = TAG + "updateCardData() --- ";
    logger.info(FUNC + "CALL...");

    let id = account.id;
    let card_old = account.card;
    let card = account.card;
    // card不为空才会进行月卡有效性检测
    if (!card) card = {};
    if (card) {
        let oldCard = {
            normal: card.normal,
            senior: card.senior,
        };
        // 普通月卡有效期检测
        if (card.normal) {
            if (!isCardValid(card, "normal")) {
                logger.error(FUNC + "普通月卡已过期");
                delete card["normal"];
            }
        }
        // 壕月卡有效期检测
        if (card.senior) {
            if (!isCardValid(card, "senior")) {
                logger.error(FUNC + "壕月卡已过期");
                delete card["senior"];
            }
        }
    }
    cb();
}

//------------------------------------------------------------------------------
// init相关操作
//------------------------------------------------------------------------------
// 增加一条记录到tbl_gold表中
function _addRecordToGoldTable(pool, id, cb) {
    const FUNC = TAG + "_addRecordToGoldTable() --- ";
    logger.info(FUNC + "CALL...");

    // 缓存中加入table_gold的结构
    let account_gold = {
        account_id: id,
        current_total: 1000,
        total_gain: 0,
        total_cost: 0,
        shop_count: 0,
        shop_amount: 0,
    };

    CacheAccount.setAccountGold(id, account_gold);
    CacheAccount.setNeedInsert(id);// 可以不加, 初始化数据时已经有了
    _addRecordToPearlTable(pool, id, cb);
}

// 增加一条记录到tbl_pearl表中
function _addRecordToPearlTable(pool, id, cb) {
    const FUNC = TAG + "_addRecordToPearlTable() --- ";
    logger.info(FUNC + "CALL...");

    let sql = 'INSERT INTO `tbl_pearl` (`account_id`, `current_total`) VALUES (?,?)';
    let sql_data = [id, init_pearl];

    logger.info('sql: ', sql);
    logger.info('sql_data: ', sql_data);

    pool.query(sql, sql_data, function (err, result) {
        if (err) {
            cb(err);
        } else {
            _updateTempname(pool, id, cb);
        }
    });
}

// 更新临时用户名
function _updateTempname(pool, id, cb) {
    const FUNC = TAG + "_updateTempname() --- ";
    logger.info(FUNC + "CALL...");

    let sql = 'UPDATE `tbl_account` SET `tempname`=concat(`tempname`, ' + id + ') WHERE `id`=?';
    let sql_data = [id];
    pool.query(sql, sql_data, function (err) {
        if (err) {
            cb(err);
        } else {
            _createSessionToken(pool, id, cb);
        }
    });
}

// 创建会话Token
function _createSessionToken(pool, id, cb) {
    const FUNC = TAG + "_createSessionToken() --- ";
    logger.info(FUNC + "CALL...");

    let token = utils.generateSessionToken(id);

    let sql = "";
    sql += "UPDATE `tbl_account` ";
    sql += "SET `token`=? ";
    sql += "WHERE `id`=?";
    let sql_data = [token, id];

    pool.query(sql, sql_data, function (err) {
        if (err) {
            cb(err);
        } else {
            // getAccountById(pool, id, cb);
            let ret = {
                id: id,
                tempname: "fj_" + id,
            };
            cb(null, [ret]);
        }
    });
}

function updateLoginCount(account, cb, vip_fill_this_time) {
    const FUNC = TAG + "updateLoginCount() --- ";
    logger.info(FUNC + "CALL...");

    // 用户的登录信息写在缓存中去
    let uid = account.id;
    CacheAccount.addLoginCount(uid, 1);
    CacheAccount.setFirstLogin(uid, 0);
    CacheAccount.setVipDailyFill(uid, 0);
    account.vip_fill_this_time = vip_fill_this_time;

    // TODO: 获取用户当日在线时间总长
    let data = {
        account_id: uid,
        token: account.token,
    };
    account.online_time = 100000;
    cb();
}

function transformSql2Redis(account) {
    let result = {};
    const FUNC = TAG + "transformSql2Redis() --- ";

    for (let i in PlayerModel) {
        if (account[i] == null) {
            result[i] = PlayerModel[i].def;
        }
        else if (PlayerModel[i].type == 'object') {
            try {
                if (account[i].substring(0, 1) != '{' && account[i].substring(0, 1) != '[') {
                    if (i == 'over_me_friends') {
                        let arr = account[i].split(',');
                        account[i] = JSON.stringify(arr);
                    }
                    else {
                        account[i] = "[" + account[i] + "]";
                    }
                }
            }
            catch(err) {
                logger.error(FUNC + "err:", err);
                logger.error(FUNC + "i:", i);
                logger.error(FUNC + "account[i]:", account[i]);
            }

            try {
                result[i] = JSON.parse(account[i]);
            }
            catch (err) {
                logger.error(FUNC + "err:", err);
                logger.error(FUNC + "i:", i);
                logger.error(FUNC + "account[i]:", account[i]);
            }
        } else {
            result[i] = account[i];
        }
    }
    return result;
}