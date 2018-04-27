const _ = require('underscore');
const BuzzUtil = require('../utils/BuzzUtil');
const CommonUtil = require('../buzz/CommonUtil');
const StringUtil = require('../utils/StringUtil');
const DateUtil = require('../utils/DateUtil');
const ErrorUtil = require('../buzz/ErrorUtil');
const buzz_vip = require('../buzz/buzz_vip');
const ObjUtil = require('../buzz/ObjUtil');
const ArrayUtil = require('../utils/ArrayUtil');
const RedisUtil = require('../utils/RedisUtil');
const redisKey= require('../../../../database').dbConsts.REDISKEY;
const ERROR_OBJ = require('../../../../consts/fish_error').ERROR_OBJ;
const DaoCommon = require('./dao_common');
const DaoReward = require('./dao_reward');
const buzz_receive_flower = require('../buzz/buzz_receive_flower');
const buzz_charts = require('../buzz/buzz_charts');
const CacheAccount = require('../buzz/cache/CacheAccount');
const CacheMail = require('../buzz/cache/CacheMail');
const CacheLogMailReward = require('../buzz/cache/CacheLogMailReward');
const gameConfig = require('../../../../utils/imports').DESIGN_CFG;
const item_item_cfg = gameConfig.item_item_cfg;
const common_log_const_cfg = gameConfig.common_log_const_cfg;

const tools = require('../../../../utils/tools');

//==============================================================================
// const
//==============================================================================
const TAG = "【dao_mail】";

// 邮件类型
const MAIL_TYPE = {
    SYS: 1,// 系统
    RANK: 2,// 排行榜
    SPECIFY: 3,// 补偿邮件(指定玩家发送)
};

// 邮件状态
const MAIL_STAT = {
    UNREAD: 1,// 未读
    READ: 2,// 已读
    GOT: 3,// 已领取
};

//==============================================================================
// public
//==============================================================================

//------------------------------------------------------------------------------
// definition
//------------------------------------------------------------------------------
exports.sendMail = sendMail;
exports.sendMails = sendMails;
exports.mailList = mailList;
exports.readMail = readMail;
exports.clearMail = clearMail;
exports.loadMail = loadMail;
exports.updateMailBox = updateMailBox;
exports.flush = flush;
exports.addMails = addMails;
exports.addMailsIn = addMailsIn;
exports.addMailsNotIn = addMailsNotIn;

exports.addMailForAll = addMailForAll;
exports.addMailForPlayer = addMailForPlayer;

exports.writeLogMailReward = writeLogMailReward;

exports.MAIL_TYPE = MAIL_TYPE;
exports.MAIL_STAT = MAIL_STAT;

//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------
/**
 * 批量发邮件(排行榜等)
 */
function sendMails(pool, data, cb) {
    // 数据验证
    if (!_prepareSendMails(data, cb)) return;
    _didSendMails(pool, data, cb);
}

/**
 * 发邮件(打赏等相关调用)
 */
function sendMail(data, cb){
    // 数据验证
    if (!_prepareSendMail(data, cb)) return;
    _didSendMail(data, cb);
}

/**
 * 获取邮件列表(前端调用).
 * 玩家点击邮箱时会调用接口mail_list, 其数据库层面的操作就是查询对应token的玩家的邮箱并返回邮箱全部内容.
 */
function mailList(data, cb) {
    let account=data.account;
    let max_mail_id = data.id;
    let num = data.num;
    let mail_box = CacheAccount.getMailList(account, max_mail_id, num);
    let mail_detail = [];
    // 需要查找到所有的邮件内容做成结构化数据块返回
    if (mail_box != null && mail_box.length > 0) {
        _getMailsDetail(mail_box, function (err, mails) {
            if(err) {
                cb && cb(ERROR_OBJ.MAIL_CONTENT_ERROR);
                return;
            }

            let box = [];
            for (let i in mail_box) {
                let mail_id = mail_box[i];
                let content = mails[mail_id];
                if(!!content && typeof(mail_id) != "undefined") {
                    mail_detail.push({
                        id: mail_id,
                        title: content.title,
                        content: content.content,
                        reward: ObjUtil.str2Data(content.reward),
                        sendtime: content.sendtime,
                    });
                    box.push(mail_id);
                }
            }
            mail_box = box;
            cb(null, mail_detail);
        });
    }
    else {
        cb(null, []);
    }
}

/**
 * 阅读邮件，有奖励就发奖(前端调用)
 * 玩家点击一封未读邮件时调用接口read_mail, 服务器需要根据邮件id查询tbl_mail获取详细邮件信息.
 * 如果tbl_mail.reward字段不为空, 则将相应的奖励发放给玩家.
 */
function readMail(pool, data, cb) {
    // 数据验证
    _prepareReadMail(data, function (err, ret) {
        if(ret){
            BuzzUtil.cacheLinkDataApi(data, "read_mail");
            _didReadMail(pool, data, cb);
        }
    });
}

/**
 * 清理邮件中的错误奖励
 */
function clearMail(pool, cb) {
    const FUNC = TAG + "clearMail() --- ";

    readMailDb(pool, "id,reward", function(err, mails) {
        if (err) {
            logger.err(FUNC + "err:", err);
            return;
        }
        let data = clearMailRewards(mails);
        writeMailDb(pool, data, cb);
    });
}

/**
 * 清除邮件中的错误奖励.
 */
function clearMailRewards(mails) {
    const FUNC = TAG + "clearMailRewards() --- ";

    let data = {
        field: "reward",
        db_case: "id",
        keyvalue_list: [],
        key_list: [],
    };
    for (let i = 0; i < mails.length; i++) {
        let id = mails[i].id;
        let reward = mails[i].reward;
        let reward_json = ObjUtil.str2Data(reward);

        let has_wrong_reward = false;
        for (let idx in reward_json) {
            let item_key = reward_json[idx][0];
            // 不存在的物品全部替换为一枚金币.
            if (!item_item_cfg[item_key]) {
                reward_json[idx][0] = "i001";
                reward_json[idx][1] = 1;
                has_wrong_reward = true;
            }
        }
        if (has_wrong_reward) {
            let str_reward = ObjUtil.data2String(reward_json);
            logger.info(FUNC + "此行有错误:", id);
            logger.info(FUNC + "修正前:", reward);
            logger.info(FUNC + "修正后:", str_reward);
            data.keyvalue_list.push({
                key: id,
                value: str_reward,
            });
            data.key_list.push(id);
        }
    }
    return [data];
}

/**
 * 读取数据库邮件.
 */
function readMailDb(pool, fields, cb) {
    const FUNC = TAG + "readMailDb() --- ";

    let sql = "";
    sql += "SELECT " + fields + " ";
    sql += "FROM tbl_mail ";
    
    let sql_data = [];
    
    logger.info(FUNC + "sql: ", sql);
    logger.info(FUNC + "sql_data: ", sql_data);
    
    pool.query(sql, sql_data, cb);
}

/**
 * 写数据库邮件.
 */
function writeMailDb(pool, data_list, cb) {
    const FUNC = TAG + "writeMailDb() --- ";

    let key_list = data_list[0].key_list.toString();
    for (let i = 0; i < data_list.length; i++) {
        if (data_list[i].key_list.length == 0) {
            logger.info(FUNC + "没有错误奖励, 不做任何修改返回");
            cb(null, "success");
            return;
        }
    }

    let sql = "";
    sql += "UPDATE tbl_mail ";
    for (let i = 0; i < data_list.length; i++) {
        let data = data_list[i];
        if (i > 0) sql += ",";
        let field = data.field;
        let db_case = data.db_case;
        let keyvalue_list = data.keyvalue_list;
        sql += "SET " + field + " = CASE " + db_case + " ";
        for (let j = 0; j < keyvalue_list.length; j++) {
            let keyvalue = keyvalue_list[j];
            let key = keyvalue.key;
            let value = keyvalue.value;
            sql += "WHEN " + key + " THEN '" + value + "' ";
        }
        sql += "END ";
        sql += "WHERE " + db_case + " IN (" + key_list + ")";
    }
    
    let sql_data = [];
    
    logger.info(FUNC + "sql: ", sql);
    logger.info(FUNC + "sql_data: ", sql_data);
    
    pool.query(sql, sql_data, cb);
}

const SHELF_LIFE = 10;//单位: 天
/**
 * 加载数据库中所有有效期(默认为3)内的邮件到内存中
 */
function loadMail(pool, cb) {
    let sql = "SELECT * ";
    sql += "FROM tbl_mail ";
    sql += "WHERE DATEDIFF(NOW(), sendtime) < ? ";
    
    let sql_data = [SHELF_LIFE];
    
    pool.query(sql, sql_data, function (err, mails) {
        for (let i in mails) {
            CacheMail.push(mails[i]);
        }
        cb(err, mails);
    });
}

/**
 * 更新缓存中的mail_box到数据库
 */
function updateMailBox(pool, cb) {
    const FUNC = TAG + "updateMailBox() --- ";

    let all_mail_box = CacheAccount.getAllMailBox();
    let all_ids = _.pluck(all_mail_box, "id");
    
    logger.info(FUNC + "all_mail_box: ", all_mail_box);
    logger.info(FUNC + "all_ids: ", all_ids);

    // 制作一个更新语句
    let sql = "";
    sql += "UPDATE tbl_account ";
    sql += "SET mail_box = CASE id ";
    for (let i = 0; i < all_mail_box.length; i++) {
        sql += "WHEN " + all_mail_box[i].id + " THEN '" + all_mail_box[i].mail_box + "' ";
    }
    sql += "END ";
    sql += "WHERE id IN (" + all_ids.toString() + ")";
    
    let sql_data = [];

    logger.info(FUNC + "sql: ", sql);
    logger.info(FUNC + "sql_data: ", sql_data);
    logger.info(FUNC + "sql.length: ", sql.length);
    
    pool.query(sql, sql_data, function (err, rows) {
        err && logger.error(FUNC + "err: ", err);
        rows && logger.info(FUNC + "rows: ", rows);
        if (cb != null) cb(err, rows);
    });
}

/**
 * TODO: 将缓存中的数据更新到数据库.
 * 注意: 目前的发送邮件是直接修改数据库, 此方法不用做任何事.
 */
function flush(pool, cb) {
    cb();
}

/**
 * @param mail_id 邮件id.
 * @param account_list 排除账号列表.
 * @param type 排行榜类型.
 */
function addMailsIn(pool, mail_id, account_list, type, platform, next) {
    getCommonSql(pool, "", account_list.toString(), type, mail_id, platform, next);
}

/**
 * @param mail_id 邮件id.
 * @param account_list 排除账号列表.
 * @param type 排行榜类型.
 */
function addMailsNotIn(pool, mail_id, account_list, type, platform, next) {
    getCommonSql(pool, "NOT ", account_list.toString(), type, mail_id, platform, next);
}

function getCondition(type) {
    switch (type) {
        case "achieve_point":
            return "AND achieve_point > 0";

        default:
            return "";
    }
}

function getCommonSql(pool, str, ids, type, mail_id, platform, next) {
    const FUNC = TAG + "getCommonSql() --- ";

        if (ids.length > 0) {
            logger.info(FUNC + '需要给' + ids.split(",").length + '个玩家发奖励');
            let sql = "";
            sql += "UPDATE tbl_account ";
            sql += "SET mail_box = CASE ";
            sql += "WHEN mail_box IS NOT NULL AND LENGTH(TRIM(mail_box)) > 0 THEN ";
            sql += "    CONCAT(mail_box, ?) ";
            sql += "WHEN mail_box IS NULL OR (mail_box IS NOT NULL AND LENGTH(TRIM(mail_box)) < 1) THEN ";
            sql += "    ? ";
            sql += "END ";
            sql += "WHERE id " + str + "IN ( " + ids + " ) ";
            sql += "AND platform=? ";
            sql += getCondition(type);
            let sql_data = ["," + mail_id, mail_id, platform];
            
            logger.info(FUNC + 'sql:\n', sql);
            logger.info(FUNC + 'sql_data:\n', sql_data);
            
            _addMail(pool, sql, sql_data, mail_id, function (err, results) {
                next();

                // 发送Redis消息
                let mail_info = {
                    mid: mail_id,
                    reciever_list: ids,
                };
                logger.info(FUNC + "mail_info:\n", mail_info);
                let message = JSON.stringify(mail_info);
                redisConnector.pub(redisKey.CH.MAIL_RANK, message);
            });
        }
        else {
            logger.info(FUNC + '玩家活跃值为0, 没有玩家需要发放奖励邮件:', mail_id);
            next();
        }
}

/**
 * @param op_set 一组操作[{},{}], 每一个操作包含{ func:?, mail_id:?, account_list:? }
 */
function addMails(pool, op_set, cb) {
    let op = op_set.shift();
    if (op.account_list.length > 0) {
        op.func(pool, op.mail_id, op.account_list, op.type, op.platform, function () {
            if (op_set.length > 0) {
                addMails(pool, op_set, cb);
            }
            else {
                cb();
            }
        });
    }
    else {
        cb();
    }
}

/**
 * 网数据库中写入日志.
 */
function writeLogMailReward(pool, cb) {
    let count = CacheLogMailReward.length();
    if (count > 0) {
        insertMassiveLogMailReward(pool, CacheLogMailReward.cache(), count, cb);
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
function insertMassiveLogMailReward(pool, group, num, cb) {
    const FUNC = TAG + "insertMassiveLogMailReward() --- ";

    logger.info(FUNC + "CALL...");
    
    if (group.length > 0) {
        
        let sql = '';
        sql += 'INSERT INTO `log_mail_reward` ';
        sql += '(`uid`,`log_at`,`mid`, `reward`) ';
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
            sql_data.push(record.mid);
            sql_data.push(record.reward);
        }
        
        logger.info(FUNC + 'sql(' + sql.length + '):\n', sql);
        logger.info(FUNC + 'sql_data(' + sql_data.length + '):\n', sql_data);
        
        pool.query(sql, sql_data, function (err, result) {
            if (err) {
                logger.error(FUNC + 'err:', err);
                logger.error(FUNC + 'sql(' + sql.length + '):\n', sql);
                logger.error(FUNC + 'sql_data(' + sql_data.length + '):\n', sql_data);
                cb && cb(err);
            }
            cb && cb(null, result);
        });

    }
    else {
        cb && cb(ERROR_OBJ.CACHE_EMPTY);
    }
}

//==============================================================================
// private
//==============================================================================

//------------------------------------------------------------------------------
// 系统操作相关
//------------------------------------------------------------------------------

//------------------------------------------------------------------------------
// 阅读邮件相关
//------------------------------------------------------------------------------
function _prepareReadMail(data, cb) {
    
    let token = data['token'];
    let id = data['id'];
    
    if (!CommonUtil.isParamExist("dao_mail", token, "接口调用请传参数token", cb)) return false;
    if (!CommonUtil.isParamExist("dao_mail", id, "接口调用请传参数id(阅读的邮件ID)", cb)) return false;

    // 验证玩家是否有这封邮件.
    let account_id = token.split("_")[0];
    CacheAccount.hasMail(account_id, id, function (err, ret) {
        if(!ret){
            logger.error("玩家请求了一封过期邮件");
        }
        cb(null, ret);
    });
}

function _didReadMail(pool, data, cb) {
    let FUNC = TAG + "_didReadMail() --- ";
    
    let token = data['token'];
    let id = data['id'];
    
    DaoCommon.checkAccount(pool, token, function (err, account) {

        if (err) {
            logger.error(FUNC + "玩家账号检测出错:", id);
            logger.error(FUNC + "出错原因——err:", err);
            cb(err);
            return;
        }

        if(account){
            // 获取邮件详细信息.

            _getMailsDetail([id], function (err, mails) {

                let mail = mails[id];
                let mail_reward = mail.reward;
                // 发放奖励.
                if (mail_reward != null) {
                    logger.error("mail_reward:", mail_reward);

                    for (let i = 0; i < mail_reward.length; i++) {
                        let reward = mail_reward[i];
                        let item_id = reward[0];
                        let item_num = reward[1];
                        if (item_id == "i005") {
                            mail_reward.splice(i, 1);
                            // 增加玩家rmb数值
                            logger.info(FUNC + "增加玩家充值经验(钻数):", item_num);
                            let params = {
                                uid: account.id,
                                diamond: item_num,
                            };
                            buzz_vip.updateRmbAndVip(null, params);
                            // account.rmb += item_num;
                        }
                    }

                    DaoReward.getReward(pool, account, mail_reward, function (err_get_reward, results_get_reward) {
                        if (err_get_reward) {
                            logger.error(JSON.stringify(err_get_reward));
                            return;
                        }
                        // account.mail_box中删除邮件.
                        // 缓存操作
                        CacheAccount.deleteMail(account, id);

                        _updateDb4AccountMailBox(pool, account.id, function (err, result) {
                            if (err) {
                                logger.error(FUNC + "err:\n", err);
                                return;
                            }
                            logger.info(FUNC + "玩家数据库中的mail_box字段已经同步");
                            let items = JSON.parse(mail_reward);
                            if(items[0][0]=="i410") {
                                //统计收到鲜花
                                buzz_receive_flower.flower_receive(account.id, items, function (currentTotal, total) {
                                    if (!tools.BuzzUtil.isCheat(account)) {
                                        buzz_charts.updateRankFlower(account.platform, account.id, currentTotal);
                                    }
                                    //根据鲜花变化数量变化魅力值
                                    //增加收到鲜花上限3000点
                                    if (total <= 3000) {
                                        CacheAccount.setCharmPointWithGivenFlower(account, currentTotal,function () {
                                            cb(null, [account]);
                                        });
                                    }
                                });
                            }else {
                                cb(null, [account]);
                            }

                            // yDONE: 增加一条玩家领取邮件奖励的记录
                            logger.error(FUNC + "增加一条玩家领取邮件奖励的记录");
                            let mailReward = {
                                uid: account.id,
                                mid: id,
                                reward: ObjUtil.data2String(mail_reward),
                                log_at: DateUtil.format(new Date(), "yyyy-MM-dd hh:mm:ss"),
                            };
                            CacheLogMailReward.push(mailReward);

                            let item_list = ObjUtil.str2Data(mail_reward);
                            logger.error(FUNC + "000mailReward:", item_list);
                            let goldGain = 0;
                            let diamondGain = 0;
                            let huafeiGain = 0;
                            for (let i = 0; i < item_list.length; i++) {
                                let reward = item_list[i];
                                let item_id = reward[0];
                                let item_num = reward[1];
                                logger.error(FUNC + "item_id:", item_id);
                                logger.error(FUNC + "item_num:", item_num);
                                if ("i001" == item_id) {
                                    goldGain += item_num;
                                }
                                if ("i002" == item_id) {
                                    diamondGain += item_num;
                                }
                                if ('i003' == item_id) {
                                    huafeiGain += item_num;
                                }
                            }
                            let uid = account.id;
                            if (goldGain > 0) {
                                // yDONE: 金币记录日志
                                logger.info(FUNC + uid + "领取邮件发放的金币");
                                logBuilder.addGoldLogEx({
                                    account_id: uid,
                                    log_at: new Date(),
                                    gain: goldGain,
                                    cost: 0,
                                    duration: 0,
                                    total: account.gold,
                                    scene: common_log_const_cfg.MAIL,
                                    nickname: 0,
                                    level: account.level,
                                });
                            }
                            if (diamondGain > 0) {
                                // yDONE: 钻石记录日志
                                logger.error(FUNC + uid + "领取邮件发放的钻石");
                                logBuilder.addPearlLogEx({
                                    account_id: uid,
                                    log_at: new Date(),
                                    gain: diamondGain,
                                    cost: 0,
                                    total: account.pearl,
                                    scene: common_log_const_cfg.MAIL,
                                    nickname: 0,
                                });
                            }
                            if (huafeiGain > 0) {
                                // yDONE: 话费券记录日志
                                logger.error(FUNC + uid + "领取邮件发放的话费券");
                                let total = account.package['9']['i003'];
                                logBuilder.addHuafeiLog({
                                    uid: uid,
                                    gain: huafeiGain,
                                    cost: 0,
                                    total: total,
                                    scene: common_log_const_cfg.MAIL,
                                    comment: "'邮件发放话费券'",
                                    time: new Date(),
                                });
                            }
                        });
                    });
                }
                else {
                    cb(null, [account]);
                }
            });


        }
        else {
            cb(new Error("缓存中没有有效期内的邮件"));
        }

    });
}

// 更新账号的邮箱数据到数据库
function _updateDb4AccountMailBox(pool, account_id, cb) {
    let FUNC = TAG + "_updateDb4AccountMailBox()---";
    // DONE: 更新数据库
    CacheAccount.getMailBox(account_id, function (err, mail_box) {
        mail_box = mail_box.toString();//做个测试
        mail_box = StringUtil.trim(mail_box, ',');

        let sql = "UPDATE tbl_account ";
        sql += "SET mail_box=? ";
        sql += "WHERE id=? ";

        let sql_data = [
            mail_box,
            account_id
        ];

        logger.info(FUNC + "sql:\n", sql);
        logger.info(FUNC + "sql_data:\n", sql_data);

        pool.query(sql, sql_data, function (err, results) {
            cb(err, results);
        });
    });
}

//------------------------------------------------------------------------------
// 邮件列表相关
//------------------------------------------------------------------------------
function _prepareMailList(data, cb) {
    
    let token = data['token'];
    let id = data['id'];
    let num = data['num'];
    
    if (!CommonUtil.isParamExist("dao_mail", token, "接口调用请传参数token", cb)) return false;
    if (!CommonUtil.isParamExist("dao_mail", id, "接口调用请传参数id(客户端持有的邮件最大ID, 服务器只需要返回此ID之后的邮件即可)", cb)) return false;
    if (!CommonUtil.isParamExist("dao_mail", num, "接口调用请传参数num(服务器需要返回给客户端的邮件条数)", cb)) return false;
    
    return true;
}


function _getMailsDetail(mids, cb){


    let sp = '';
    for(let i = 1; i <= mids.length; ++i){
        sp += '?';
        if(i!= mids.length){
            sp += ',';
        }
    }

    let sql = `SELECT * FROM tbl_mail WHERE id IN(${sp})`;
    mysqlConnector.query(sql, mids, function (err, results) {
        if(err){
            cb(err);
            return;
        }

        let objs = {};

        if(results && results.length){
            for(let i = 0; i< results.length; ++i){
                objs[results[i].id] = results[i];
            }
        }

        cb(err, objs);
    });

}


function _didMailList(pool, data, cb) {
    const FUNC = TAG + "_didMailList() --- ";
    
    logger.info("【CALL】_didMailList");

    let token = data['token'];
    let max_mail_id = data['id'];
    let num = data['num'];
    

        logger.info("token:", token);
        logger.info("max_mail_id:", max_mail_id);
        logger.info("num:", num);


    DaoCommon.checkAccount(pool, token, function (err, account) {
        if (err) {
            cb(err);
            return;
        }
        let mail_box = CacheAccount.getMailList(account, max_mail_id, num);
        let mail_detail = [];
        // 需要查找到所有的邮件内容做成结构化数据块返回
        if (mail_box != null && mail_box.length > 0) {
            _getMailsDetail(mail_box, function (err, mails) {
                if(err) {
                    cb && cb(ERROR_OBJ.MAIL_CONTENT_ERROR);
                    return;
                }

                let box = [];
                for (let i in mail_box) {
                    let mail_id = mail_box[i];
                    let content = mails[mail_id];
                    if(!!content && typeof(mail_id) != "undefined") {
                        mail_detail.push({
                            id: mail_id,
                            title: content.title,
                            content: content.content,
                            reward: ObjUtil.str2Data(content.reward),
                            sendtime: content.sendtime,
                        });
                        box.push(mail_id);
                    }
                }
                mail_box = box;
                cb(null, mail_detail);
            });
        }
        else {
            cb(null, []);
        }

    });
}

//------------------------------------------------------------------------------
// 批量发送邮件相关
//------------------------------------------------------------------------------
function _prepareSendMails(data, cb) {
    
    let type = data['type'];
    let mail_list = data['mail_list'];
    
    if (!CommonUtil.isParamExist("dao_mail", type, "接口调用请传参数type(邮件类型, 1.系统邮件; 2.排行榜邮件; 3.补偿邮件)", cb)) return false;
    if (!CommonUtil.isParamExist("dao_mail", mail_list, "接口调用请传参数mail_list(邮件列表)", cb)) return false;

    return true;
}

function _didSendMails(pool, data, cb) {
    const FUNC = TAG + "_didSendMails() --- ";
    
    let mail_list = data.mail_list;
    
    let sql = "INSERT INTO tbl_mail ";
    sql += "(type, title, content, reward) ";
    sql += "VALUES ";
    for (let i = 0; i < mail_list.length; i++) {
        if (i > 0) {
            sql += ",";
        }
        sql += "(?,?,?,?) ";
    }
    
    let sql_data = [];
    for (let i = 0; i < mail_list.length; i++) {
        sql_data.push(data.type);
        sql_data.push(mail_list[i].title);
        sql_data.push(mail_list[i].content);
        sql_data.push(mail_list[i].reward);
    }
    
    pool.query(sql, sql_data, function (err, results) {
        ErrorUtil.handleDbError(err, sql, sql_data, 1, FUNC);
        cb(err, results);
    });
}

//------------------------------------------------------------------------------
// 发送邮件相关
//------------------------------------------------------------------------------
function _prepareSendMail(data, cb) {
    const FUNC = TAG + "_prepareSendMail() --- ";

    //let token = data['token'];
    let type = data['type'];
    let title = data['title'];
    let content = data['content'];
    let reward = data['reward'];
        
    //if (!_isParamExist(token, "接口调用请传参数token", cb)) return false;
    if (!CommonUtil.isParamExist("dao_mail", type, "接口调用请传参数type(邮件类型, 1.系统邮件; 2.排行榜邮件)", cb)) return false;
    if (!CommonUtil.isParamExist("dao_mail", title, "接口调用请传参数title(邮件标题)", cb)) return false;
    if (!CommonUtil.isParamExist("dao_mail", content, "接口调用请传参数content(邮件内容)", cb)) return false;
    if (!CommonUtil.isParamExist("dao_mail", reward, '接口调用请传参数reward(邮件奖励["i011", 10])', cb)) return false;

    // 2. TODO: 管理员验证

    // 3. DONE: reward数据格式验证
    try {
        let reward_json = JSON.parse(reward);
        if (!ArrayUtil.isArray(reward_json)) {
            cb(ERROR_OBJ.MAIL_REWARD_NOT_ARRAY);
            return false;
        }
        // BUG352: 服务器增加邮件奖励检测, 查看发放物品是否真实存在
        let invalid_item_list = [];
        for (let idx in reward_json) {
            let item_key = reward_json[idx][0];
            if (!item_item_cfg[item_key]) {
                invalid_item_list.push(item_key);
            }
        }
        if (invalid_item_list.length > 0) {
            let extraErrInfo = { debug_info: "不存在的物品:" + invalid_item_list.toString() };
            logger.error(FUNC + extraErrInfo.debug_info);
            cb(ObjUtil.merge(extraErrInfo, ERROR_OBJ.MAIL_REWARD_INVALID));
            return false;
        }
    }
    catch(err) {
        logger.error("reward:", reward);
        cb(ERROR_OBJ.MAIL_WRONG_JSON_FORMAT);
        return false;
    }

    return true;
}

async function _didSendMail(data, cb) {
    const FUNC = TAG + "_didSendMail() --- ";
    logger.info(FUNC + "player_list:", data.player_list);
    logger.info(FUNC + "data:", data);

    if (typeof(data.player_list) == "undefined" || data.player_list == "undefined") {
        cb && cb(ERROR_OBJ.MAIL_NULL_RECEIVER_LIST);
        return;
    }

    let sql = "INSERT INTO tbl_mail ";
    sql += "(type, title, content, reward) ";
    sql += "VALUES ";
    sql += "(?,?,?,?) ";
    
    let sql_data = [
        data.type,
        data.title,
        data.content,
        data.reward
    ];
    try{
        let results =await tools.SqlUtil.query(sql, sql_data);
        cb(null, results.insertId);
    }catch (err){
        cb(err);
    }
}

/**
 * 在tbl_account.mail_box中插入一条邮件.
 * 邮件对象为mail = { id : MailId, stat : [UNREAD|READ|GOT] }
 * 邮箱(mail_box)数据格式为[ mail1, mail2, ... , mailN ], 注意存储时无中括号"[]"方便使用SQL语句直接UPDATE.
 * @param mail_id 插入的邮件ID
 */
function addMailForAll(pool, mail_id, cb) {
    const FUNC = TAG + "addMailForAll() --- ";
    logger.info(FUNC + "CALL...");

    _addMailAll(pool, mail_id, null, function (err, results) {
        cb(err, mail_id);
    });
}

/**
 * 仅向指定玩家发送邮件.
 * @param mail_id 插入的邮件ID
 * @param payer_list 指定玩家的ID列表
 */
function addMailForPlayer(pool, mail_id, payer_list, cb) {
    const FUNC = TAG + "addMailForPlayer() --- ";
    logger.info(FUNC + "CALL...");

    _addMailAll(pool, mail_id, payer_list, function (err, results) {
        cb(err, mail_id);
    });
}

function _addMailAll(pool, mail_id, payer_list, cb) {
    let sql = "";
    sql += "UPDATE tbl_account ";
    sql += "SET mail_box = CASE ";
    sql += "WHEN mail_box IS NOT NULL AND LENGTH(TRIM(mail_box)) > 0 THEN ";
    sql += "    CONCAT(mail_box, ?) ";
    sql += "WHEN mail_box IS NULL OR (mail_box IS NOT NULL AND LENGTH(TRIM(mail_box)) < 1) THEN ";
    sql += "    ? ";
    sql += "END ";
    if (payer_list) {
        sql += "WHERE id IN (" + payer_list + ") ";
    }
    let sql_data = ["," + mail_id, mail_id];
    
    _addMail(pool, sql, sql_data, mail_id, cb);
}

function _addMail(pool, sql, sql_data, mail_id, cb) {
    const FUNC = TAG + "_addMail() --- ";
    pool.query(sql, sql_data, function (err, results) {
        ErrorUtil.handleDbError(err, sql, sql_data, 1, FUNC);
        if (err) return cb(err);
        cb(err, results);
    });
}