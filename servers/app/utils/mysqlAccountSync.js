const sql_pojo = require('../models/sql_pojo');
const sql_fields = sql_pojo.fields;
const PlayerModel = require('../models/keyTypeDef').PlayerModel;
const DateUtil = require('./DateUtil');
const ERROR_OBJ = require('../consts/fish_error').ERROR_OBJ;
const utils = require('./utils');
const moment = require('moment');

/**
 * 获取mysql中account信息
 * @param uid
 * @param fields
 * @param cb
 */
function getAccount(uid, fields, cb) {
    if (!uid) {
        utils.invokeCallback(cb, ERROR_OBJ.PARAM_MISSING);
        return;
    }

    if (typeof fields === 'function') {
        cb = fields;
        fields = [];
    }
    let fields_obj = {};
    let table = {};
    if (fields && fields.length > 0) {
        for (let i in fields) {
            let f = fields[i];
            fields_obj[f] = 1;
            let t = sql_fields[f].table;
            table[t] = 1;
        }
    } else {
        for (let i in sql_fields) {
            fields_obj[i] = 1;
            let t = sql_fields[i].table;
            table[t] = 1;
        }
    }

    var sql = _resultList(table, fields_obj);

    mysqlConnector.query(sql, [uid], function (err, res) {
        if (err) {
            logger.error('getAccount err:', err);
            utils.invokeCallback(cb, ERROR_OBJ.DB_ERR);
        } else {
            if (res && res[0]) {
                utils.invokeCallback(cb, null, transformSql2Redis(res[0]));
            } else {
                utils.invokeCallback(cb, ERROR_OBJ.USER_NOT_EXIST);
            }
        }
    });
}

async function getAccountSync(uid, fields) {
    return new Promise(function (resolve, reject) {
        getAccount(uid, fields, function (err, account) {
            if (err) {
                reject(err);
            } else {
                resolve(account);
            }
        });
    });
}

async function setAccountSync(accounts) {
    return new Promise(function (resolve, reject) {
        setAccount(accounts, function (err, account) {
            if (err) {
                reject(err);
            } else {
                resolve(account);
            }
        });
    });
}

/**
 * 设置account信息到mysql
 * @param uid
 * @param data
 * @param cb
 */
function setAccount(accounts, cb) {
    if(!Array.isArray(accounts)){
        accounts = [accounts];
    }

    let sqlParams = [];
    for (let i in accounts) {
        let account = accounts[i];
        let result = transformRedis2Sql(account);
        for (let table in sql_pojo.tables) {
            let temp_key = [];
            let temp_value = [];
            // if (table == 'tbl_social' && !result["has_social"]) {
            //     continue;
            // }
            for (let field in sql_pojo[table]) {
                if (result[field] != null) {
                    temp_key.push(sql_pojo[table][field].name);
                    if (sql_pojo[table][field].type == 'timestamp') {
                        let value = result[field];
                        let re = /^[0-9]+.?[0-9]*$/;
                        let rrr = /(中国标准时间)/;
                        if (re.test(value)) {
                            if (value == 0 || value == '0') {
                                temp_value.push("1970-01-02 00:00:00");
                            } else {
                                let d = new Date();
                                d.setTime(value);
                                d = DateUtil.format(d, "yyyy-MM-dd hh:mm:ss");
                                temp_value.push(d);
                            }
                        } else if (rrr.test(value)) {
                            let d = DateUtil.format(new Date(value), "yyyy-MM-dd hh:mm:ss");
                            temp_value.push(d);
                        } else {
                            temp_value.push(result[field]);
                        }
                    } else {
                        temp_value.push(result[field]);
                    }
                }

            }
            if (temp_key.length < 2) {
                continue;
            }


            let sql = insert_templet(table, temp_key);
            sqlParams.push({
                sql: sql,
                params: temp_value
            });

        }
    }
    if (sqlParams.length == 0) {
        cb && cb(null);
        return;
    }
    // logger.error('数据同步值-------------------------:', sqlParams);
    mysqlConnector.execTransaction(sqlParams, function (err, res) {
        cb && cb(err, res);
    });
}

/**
 * 数据库查询接口
 * @param {表名} table
 * @param {查询字段,传入redis中的字段名称!} fields
 * @param {查询条件} condition
 */
function query_templet(table, fields, condition) {
    var sql = "SELECT ";
    for (let i = 0; i < fields.length; i++) {
        //redis字段对应mysql中字段的名称
        let f = fields[i];
        let sql_field = sql_fields[f].name;
        if (!sql_field) {
            throw new Error("参数异常！！！");
        }
        if (i == 0) {
            sql += sql_field + " AS " + fields[i];
        } else {
            sql += "," + sql_field + " AS " + fields[i];
        }
    }
    sql += "FROM " + table + " WHERE ";
    let tmp = 0;
    let sql_data = [];
    for (let k in condition) {
        let table_tmp = sql_pojo[table];
        let sql_value = table_tmp[k].name;

        if (tmp == 0) {
            sql += sql_value + "=? ";
            tmp++;
        } else {
            sql += "AND " + sql_value + "=? ";
        }
        sql_data.push(condition[k]);
    }
    return {
        sql: sql,
        param: sql_data
    };
}

function transformRedis2Sql(account) {
    let result = {};
    for (let i in PlayerModel) {
        if (account[i] != null) {
            if (PlayerModel[i].type == 'object') {
                result[i] = JSON.stringify(account[i]);
                for (let field in sql_pojo.need_update_fields) {
                    if (field == i) {
                        result[i] = result[i].replace("[", "").replace("]", "");
                    }
                }
            } else {
                result[i] = account[i];
                if (i == 'nickname') {
                    let nick = account[i];
                    if (nick.length > 32) {
                        result[i] = nick.substring(0, 32);
                    }
                } else {
                    result[i] = account[i];
                }
            }
        }

    }

    return result;
}

function insert_templet(table, fields) {
    let sql = "INSERT INTO " + table + " (";
    for (let i in fields) {
        if (i == 0) {
            sql += fields[i];
        } else {
            sql += "," + fields[i];
        }
    }
    sql += ") VALUES(";
    for (let i in fields) {
        if (i == 0) {
            sql += "?";
        } else {
            sql += ",?";
        }
    }
    sql += ") ON DUPLICATE KEY UPDATE ";
    let k = 0;
    for (let i in fields) {
        // BUG解决: tbl_gold和tbl_pearl中插入重复account_id的数据导致数据查询量过大
        // tbl_gold和tbl_pearl需要设置account_id为UNIQUE
        // ALTER TABLE tbl_gold ADD UNIQUE(`account_id`);
        // ALTER TABLE tbl_pearl ADD UNIQUE(`account_id`);
        if (k == 0 && fields[i] != 'id' && fields[i] != 'account_id') {
            sql += fields[i] + "=VALUES(" + fields[i] + ")";
            k++;
        } else if (k > 0 && fields[i] != 'id' && fields[i] != 'account_id') {
            sql += "," + fields[i] + "=VALUES(" + fields[i] + ")";
        }
    }

    return sql;
}

function _resultList(table, fields) {

    var sql = '';
    sql += 'SELECT ';
    sql += 'a.`id` ';
    if (fields.jointype) sql += ',a.`jointype` ';
    if (fields.who_invite_me) sql += ',a.`who_invite_me` ';
    if (fields.who_share_me) sql += ',a.`who_share_me` ';
    if (fields.nickname) sql += ',a.`tempname` ';
    if (fields.nickname) sql += ',a.`nickname` ';
    if (fields.channel) sql += ',a.`channel` ';
    if (fields.nickname) sql += ',a.`channel_account_name` ';
    if (fields.channel_account_id) sql += ',a.`channel_account_id` ';
    if (fields.created_at) sql += ',a.`created_at` ';
    if (fields.pfft_at) sql += ',a.`pfft_at` ';
    if (fields.login_count) sql += ',a.`login_count` ';
    if (fields.logout_count) sql += ',a.`logout_count`  ';
    if (fields.salt) sql += ',a.`salt`  ';
    if (fields.token) sql += ',a.`token`  ';
    if (fields.password) sql += ',a.`password`  ';
    if (fields.charm_rank) sql += ',a.`charm_rank`  ';
    if (fields.charm_point) sql += ',a.`charm_point`  ';
    if (fields.vip) sql += ',a.`vip`  ';
    if (fields.rmb) sql += ',a.`rmb`  ';
    if (fields.exp) sql += ',a.`exp`  ';
    if (fields.level) sql += ',a.`level`  ';
    if (fields.gold) sql += ',a.`gold`  ';
    if (fields.pearl) sql += ',a.`pearl`  ';
    if (fields.weapon) sql += ',a.`weapon`  ';
    if (fields.weapon_energy) sql += ',a.`weapon_energy`  ';
    if (fields.vip_weapon_id) sql += ',a.`vip_weapon_id`  ';
    if (fields.skill) sql += ',a.`skill`  ';
    if (fields.broke_times) sql += ',a.`broke_times`  ';
    if (fields.day_reward) sql += ',a.`day_reward`  ';
    if (fields.day_reward_adv) sql += ',a.`day_reward_adv`  ';
    if (fields.new_reward_adv) sql += ',a.`new_reward_adv`  ';
    if (fields.day_reward_weekly) sql += ',a.`day_reward_weekly`  ';
    if (fields.vip_daily_fill) sql += ',a.`vip_daily_fill`  ';
    if (fields.level_mission) sql += ',a.`level_mission`  ';
    if (fields.mission_daily_reset) sql += ',a.`mission_daily_reset`  ';
    if (fields.mission_only_once) sql += ',a.`mission_only_once`  ';
    if (fields.first_buy) sql += ',a.`first_buy`  ';
    if (fields.first_buy_gift) sql += ',a.`first_buy_gift`  ';
    if (fields.activity_gift) sql += ',a.`activity_gift`  ';
    if (fields.heartbeat) sql += ',a.`heartbeat`  ';
    if (fields.heartbeat_min_cost) sql += ',a.`heartbeat_min_cost`  ';
    if (fields.achieve_point) sql += ',a.`achieve_point`  ';
    if (fields.gold_shopping) sql += ',a.`gold_shopping`  ';
    if (fields.weapon_skin) sql += ',a.`weapon_skin`  ';
    if (fields.bonus) sql += ',a.`bonus`  ';
    if (fields.drop_reset) sql += ',a.`drop_reset`  ';
    if (fields.drop_once) sql += ',a.`drop_once`  ';
    if (fields.comeback) sql += ',a.`comeback`  ';
    if (fields.vip_gift) sql += ',a.`vip_gift`  ';
    if (fields.pirate) sql += ',a.`pirate`  ';
    if (fields.card) sql += ',a.`card`  ';
    if (fields.get_card) sql += ',a.`get_card`  ';
    if (fields.package) sql += ',a.`package`  ';
    if (fields.guide) sql += ',a.`guide`  ';
    if (fields.guide_weak) sql += ',a.`guide_weak`  ';
    if (fields.active) sql += ',a.`active`  ';
    if (fields.active_daily_reset) sql += ',a.`active_daily_reset`  ';
    if (fields.active_stat_once) sql += ',a.`active_stat_once`  ';
    if (fields.active_stat_reset) sql += ',a.`active_stat_reset`  ';
    if (fields.free_draw) sql += ',a.`free_draw`  ';
    if (fields.total_draw) sql += ',a.`total_draw`  ';
    if (fields.mail_box) sql += ',a.`mail_box`  ';
    if (fields.roipct_time) sql += ',a.`roipct_time`  ';
    if (fields.goddess) sql += ',a.`goddess`  ';
    if (fields.goddess_free) sql += ',a.`goddess_free`  ';
    if (fields.goddess_ctimes) sql += ',a.`goddess_ctimes`  ';
    if (fields.goddess_crossover) sql += ',a.`goddess_crossover`  ';
    if (fields.goddess_ongoing) sql += ',a.`goddess_ongoing`  ';
    if (fields.redress_no) sql += ',a.`redress_no`  ';
    if (fields.first_login) sql += ',a.`first_login`  ';
    if (fields.aquarium) sql += ',a.`aquarium`  ';
    if (fields.platform) sql += ',a.`platform`  ';
    if (fields.test) sql += ',a.`test`  ';
    if (fields.figure) sql += ',a.`figure`  ';
    if (fields.rank_in_friends) sql += ',a.`rank_in_friends`  ';
    if (fields.over_me_friends) sql += ',a.`over_me_friends`  ';
    if (fields.last_online_time) sql += ',a.`last_online_time`  ';
    // if (fields.recharge) sql += ',a.`recharge`  ';
    // if (fields.cash) sql += ',a.`cash`  ';
    // if (fields.cost) sql += ',a.`cost`  ';
    // if (fields.gain_loss) sql += ',a.`gain_loss`  ';

    // if(fields=={} || fields.id) sql += 'i.`web_url` AS figure_url, ';
    // if (fields.figure_url) sql += ",i.`web_url` AS figure_url ";

    if (fields.month_sign) sql += ',asign.`month_sign` AS month_sign ';
    // if (fields.sid) sql += ',server.`sid` AS sid ';

    if (fields.match_on) sql += ',s.`match_on` AS match_on ';
    if (fields.cik_on) sql += ',s.`cik_on` AS cik_on ';
    if (fields.cdkey_on) sql += ',s.`cdkey_on` AS cdkey_on ';
    if (fields.msgboard_mgmt) sql += ',s.`msgboard_mgmt` AS msgboard_mgmt ';

    if (fields.max_wave) sql += ',g.`max_wave` AS max_wave ';
    if (fields.goddess_balance_time) sql += ',g.`updated_at` AS goddess_balance_time ';
    if (fields.week_reward) sql += ',g.`week_reward` AS week_reward ';
    if (fields.week_rank) sql += ',g.`week_rank` AS week_rank ';

    if (fields.petfish_recent_time) sql += ',aq.`updated_at` AS petfish_recent_time ';
    if (fields.petfish_total_level) sql += ',aq.`total_level` AS petfish_total_level ';

    if (fields.match_recent_time) sql += ',r.`updated_at` AS match_recent_time ';
    if (fields.match_win) sql += ',r.`win` AS match_win ';
    if (fields.match_fail) sql += ',r.`fail` AS match_fail ';
    if (fields.match_points) sql += ',r.`points` AS match_points ';
    if (fields.match_rank) sql += ',r.`rank` AS match_rank ';
    if (fields.match_unfinish) sql += ',r.`unfinish` AS match_unfinish ';
    if (fields.match_box_list) sql += ',r.`box` AS match_box_list ';
    if (fields.match_box_timestamp) sql += ',r.`box_timestamp` AS match_box_timestamp ';
    if (fields.match_1st_box) sql += ',r.`first_box` AS match_1st_box ';
    if (fields.match_season_count) sql += ',r.`season_count` AS match_season_count ';
    if (fields.match_season_win) sql += ',r.`season_win` AS match_season_win ';
    if (fields.match_season_box) sql += ',r.`season_box` AS match_season_box ';
    if (fields.match_season_1st_win) sql += ',r.`season_first_win` AS match_season_1st_win ';
    if (fields.match_got_season_reward) sql += ',r.`is_season_reward` AS match_got_season_reward ';
    if (fields.match_winning_streak) sql += ',r.`winning_streak` AS match_winning_streak ';

    // if (fields.gold_total_gain) sql += ',gold.`total_gain` AS gold_total_gain ';
    // if (fields.gold_total_cost) sql += ',gold.`total_cost` AS gold_total_cost ';
    // if (fields.gold_shop_count) sql += ',gold.`shop_count` AS gold_shop_count ';
    // if (fields.gold_shop_amount) sql += ',gold.`shop_amount` AS gold_shop_amount ';

    // if (fields.diamond_total_gain) sql += ',diamond.`total_gain` AS diamond_total_gain ';
    // if (fields.diamond_total_cost) sql += ',diamond.`total_cost` AS diamond_total_cost ';
    // if (fields.diamond_shop_count) sql += ',diamond.`shop_count` AS diamond_shop_count ';
    // if (fields.diamond_shop_amount) sql += ',diamond.`shop_amount` AS diamond_shop_amount ';

    if (fields.has_social) sql += ',social.`id` AS has_social ';
    if (fields.social_invite_friends) sql += ',social.`invite_friends` AS social_invite_friends ';
    if (fields.social_share_friends) sql += ',social.`share_friends` AS social_share_friends ';
    if (fields.social_invite_progress) sql += ',social.`invite_progress` AS social_invite_progress ';
    if (fields.social_invite_reward) sql += ',social.`invite_reward` AS social_invite_reward ';
    if (fields.social_share_status_0) sql += ',social.`share_status_0` AS social_share_status_0 ';
    if (fields.social_share_status_1) sql += ',social.`share_status_1` AS social_share_status_1 ';
    if (fields.social_share_status_2) sql += ',social.`share_status_2` AS social_share_status_2 ';
    if (fields.social_enshrine_status) sql += ',social.`enshrine_status` AS social_enshrine_status';
    if (fields.social_share_top_gold) sql += ',social.`share_top_gold` AS social_share_top_gold ';
    if (fields.social_share_top_rank) sql += ',social.`share_top_rank` AS social_share_top_rank ';

    // 左连接查询
    sql += 'FROM `tbl_account` a ';
    if (table.tbl_account_sign) sql += 'LEFT JOIN `tbl_account_sign` asign ON a.id=asign.id ';
    // if (table.tbl_account_server) sql += 'LEFT JOIN `tbl_account_server` server ON a.id=server.uid ';
    // if (table.tbl_img) sql += 'LEFT JOIN `tbl_img` i ON a.figure=i.id ';
    if (table.tbl_switch) sql += 'LEFT JOIN `tbl_switch` s ON a.id=s.id ';
    if (table.tbl_goddess) sql += 'LEFT JOIN `tbl_goddess` g ON a.id=g.id ';
    if (table.tbl_aquarium) sql += 'LEFT JOIN `tbl_aquarium` aq ON a.id=aq.id ';
    if (table.tbl_rankgame) sql += 'LEFT JOIN `tbl_rankgame` r ON a.id=r.id ';
    // if (table.tbl_gold) sql += 'LEFT JOIN `tbl_gold` gold ON a.id=gold.account_id ';
    // if (table.tbl_pearl) sql += 'LEFT JOIN `tbl_pearl` diamond ON a.id=diamond.account_id ';
    if (table.tbl_social) sql += 'LEFT JOIN `tbl_social` social ON a.id=social.id ';
    sql += 'WHERE a.`id`=? ';
    return sql;
}

function transformSql2Redis(account) {
    let result = {};

    for (let i in PlayerModel) {
        if (account[i] != null) {
            if (PlayerModel[i].type === 'object') {
                try {
                    result[i] = JSON.parse(account[i]);
                } catch (err) {
                    try {
                        if (PlayerModel[i].def instanceof Array) {
                            result[i] = JSON.parse("[" + account[i] + "]");
                        }
                        else if (typeof PlayerModel[i].def === 'object') {
                            result[i] = JSON.parse("{" + account[i] + "}");
                        }
                    } catch (err) {
                        logger.error(`用户${account.id}数据${i}解析错误：${account[i]}`);
                    }
                }
            } else if (PlayerModel[i].type === 'timestamp') {
                if (account[i] === '0000-00-00 00:00:00') {
                    account[i] = '1970-01-02 00:00:00';
                }
                account[i] = moment(account[i]).format('YYYY-MM-DD HH:mm:ss');
            } else {
                result[i] = account[i];
            }
        } else if ('nickname' == i) {//姓名特殊处理
            result[i] = account['channel_account_name'] || account['temp_name'];
        }
    }

    return result;
}

module.exports.getAccount = getAccount;
module.exports.getAccountSync = getAccountSync;
module.exports.setAccount = setAccount;
module.exports.setAccountSync = setAccountSync;