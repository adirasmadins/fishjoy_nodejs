const _ = require('underscore');
const BuzzUtil = require('../utils/BuzzUtil');
const CacheAccount = require('../buzz/cache/CacheAccount');
const DateUtil = require('../utils/DateUtil');
const DaoMail = require('./dao_mail');
const gameConfig = require('../../../../utils/imports').DESIGN_CFG;
const ITEM_TYPE = gameConfig.shop_itemtype_const_cfg;
const shop_shop_buy_type_cfg = gameConfig.shop_shop_buy_type_cfg;
const change_change_cfg = gameConfig.change_change_cfg;
const vip_vip_cfg = gameConfig.vip_vip_cfg;
const CHANNEL_ID = require('../../../../consts/constDef').CHANNEL_ID;
const dao_reward = require('./dao_reward');
const ERROR_OBJ = require('../../../../consts/fish_error').ERROR_OBJ;
const moment = require('moment');
const tools = require('../../../../utils/tools');


const TAG = "【dao_shop】";

const MAIL_TYPE = DaoMail.MAIL_TYPE;

exports.createPayOrderItem = _createPayOrderItem;
exports.checkOrder = _checkOrder;
exports.updateOrderInfo = _updateOrderInfo;
exports.changeOrderStatus = _changeOrderStatus;
exports.setOrderFail = setOrderFail;

exports.addShopLog = addShopLog;
exports.hasCard = hasCard;
exports.getOrderInfo = getOrderInfo;
exports.checkIOSOrder = checkIOSOrder;
exports.getVietnamCardTypeInfo = getVietnamCardTypeInfo;
//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------

// 获取电话卡信息
function getVietnamCardTypeInfo(cardType_id) {
    for (var idx in change_change_cfg) {
        var record = change_change_cfg[idx];
        if (Number(record.type2) == Number(cardType_id)) {
            return record;
        }
    }
    return null;
}

/**
 * 创建订支付订单条目.
 */
async function _createPayOrderItem(data) {
    let sql = '';
    sql += 'SELECT MAX(`sn`) AS max_sn ';
    sql += 'FROM `tbl_order` ';
    sql += 'WHERE TO_DAYS(NOW()) = TO_DAYS(`created_at`)';

    logger.info('_createPayOrderItem sql: ', sql);
    let result = await mysqlConnector.query(sql);
    let sn = 0;
    if (result.length > 0) {
        sn = result[0]["max_sn"] + 1;
    }
    logger.info("sn: " + sn);
    data.sn = sn;
    let game_order_id = await _insertOrder(data);
    return game_order_id;
}

async function _updateOrderInfo(game_order_id, objs) {

    let sql = '';
    sql += 'UPDATE `tbl_order` ';
    sql += 'SET ';

    let sql_data = [];
    for (let key in objs) {
        sql += '`' + key + '`' + ' = ?,';
        sql_data.push(objs[key]);
    }
    sql = sql.substring(0, sql.length - 1);
    sql += ' WHERE game_order_id = ?';

    sql_data.push(game_order_id);

    logger.info('_updateOrderInfo sql:\n', sql);
    logger.info('_updateOrderInfo sql_data:\n', sql_data);

    await mysqlConnector.query(sql, sql_data);
}

/**
 * 插入一条订单数据
 * @param uid
 * @param shop_id
 * @param sn
 * @param goods_name
 * @return {Promise}
 * @private uid, shop_id, sn, goods_name
 */
async function _insertOrder(data) {
    const FUNC = TAG + "_insertOrder() --- ";
    let game_order_id = BuzzUtil.getOrderId(data.sn);

    let sql = '';
    sql += 'INSERT INTO `tbl_order` ';
    sql += '(`game_account_id`, `sn`, `game_order_id`, `goods_name`,`goods_id`,`goods_number`,`channel`,`item_type`) ';
    sql += 'VALUES (?,?,?,?,?,?,?,?)';
    let sql_data = [data.uid, data.sn, game_order_id, data.goods_name, data.goods_id, 1, data.channelid, data.itemtype];

    logger.info(FUNC + 'sql:\n', sql);
    logger.info(FUNC + 'sql_data:\n', sql_data);

    await mysqlConnector.query(sql, sql_data);

    return game_order_id;
}

/**
 * 改变订单状态
 */
function _changeOrderStatus(pool, data, cb) {
    let channel_cb = data['channel_cb'];
    let game_order_id = data['game_order_id'];

    // 错误检验
    if (channel_cb == null) {
        cb(new Error('接口调用请传参数channel_cb(渠道的回调信息)'));
        return;
    }
    if (game_order_id == null) {
        cb(new Error('接口调用请传参数game_order_id(游戏订单ID)'));
        return;
    }

    _didChangeOrderStatus(pool, data, cb);
}

function setOrderFail(pool, data, cb) {
    const FUNC = TAG + "setOrderFail() --- ";

    let channel_cb = data['channel_cb'];
    let game_order_id = data['game_order_id'];
    let channel = data['channel'];
    let goods_id = data['goods_id'];
    let goods_number = data['goods_number'];
    let channel_account_id = data['channel_account_id'];
    let money = data['money'];

    if (channel == CHANNEL_ID.WANBA) {
        let sql = '';
        sql += 'UPDATE `tbl_order` ';
        sql += 'SET `status`=?, `channel_cb`=?, `channel`=?, `goods_id`=?, `goods_number`=?, `channel_account_id`=?, `money`=? ';
        sql += 'WHERE game_order_id=?';
        logger.info(FUNC + 'sql: ', sql);

        let sql_data = [
            1,
            JSON.stringify(channel_cb),
            channel,
            goods_id,
            goods_number,
            channel_account_id,
            money,
            game_order_id
        ];

        pool.query(sql, sql_data, function (err, result) {
            if (err) {
                logger.error(FUNC + '[ERROR] err:', err);
                return;
            }
            logger.info('result: ', result);
            cb(null, "ok");
            return;
        });
    } else {
        cb(new Error("not supported channel!!"));
    }
}

/**
 * 检查订单是否有效
 * @param game_order_id
 * @return {Promise.<*>}
 * @private
 */
async function _checkOrder(game_order_id) {
    let sql = '';
    sql += 'SELECT goods_id,game_account_id FROM `tbl_order` ';
    sql += 'WHERE game_order_id=?';

    try {
        let result = await mysqlConnector.query(sql, [game_order_id]);
        if (!result[0]) {
            logger.error(`订单${game_order_id}非法`);
            throw ERROR_OBJ.ORDER_ILLEGAL;
        }
        return result[0];
    }catch (err){
        logger.error('checkOrder err:', err);
        throw err;
    }
}

function getOrderInfo(game_order_id) {
    let sql = '';
    sql += 'SELECT * FROM `tbl_order` ';
    sql += 'WHERE game_order_id=?';

    return new Promise(function (resolve, reject) {
        mysqlConnector.query(sql, [game_order_id], function (err, result) {
            if (err) {
                logger.error('getOrderInfo err:', err);
                reject(err);
                return;
            }
            if (!result[0]) {
                reject(ERROR_OBJ.ORDER_ILLEGAL);
                return;
            }
            logger.info('getOrderInfo: ', result[0]);
            resolve(result[0]);
        });
    });
}

function checkIOSOrder(channel_order_id) {
    let sql = '';
    sql += 'SELECT game_order_id,status FROM `tbl_order` ';
    sql += 'WHERE channel_order_id=?';
    return new Promise(function (resolve, reject) {
        mysqlConnector.query(sql, [channel_order_id], function (err, result) {
            if (err) {
                logger.error('[ERROR] err:', err);
                reject(err);
                return;
            }
            logger.info('getOrderInfo: ', result);
            resolve(result[0]);
        });
    });
}

// 参数检查完毕后进行订单状态更新
function _didChangeOrderStatus(pool, data, cb) {
    const FUNC = TAG + "_didChangeOrderStatus() --- ";

    let channel_cb = data['channel_cb'];
    let game_order_id = data['game_order_id'];
    let channel = data['channel'];

    // 从channel_cb中获取的参数
    let channel_order_id = channel_cb.orderId;
    let channel_account_id = channel_cb.id;
    let money = channel_cb.money;
    let time = channel_cb.time;
    let serverId = channel_cb.serverId;
    let goods_id = channel_cb.goodsId;
    let goods_number = channel_cb.goodsNumber;
    let sign = channel_cb.sign;

    logger.info(FUNC + "orderId: " + channel_order_id);
    logger.info(FUNC + "id: " + channel_account_id);
    logger.info(FUNC + "money: " + money);
    logger.info(FUNC + "time: " + time);
    logger.info(FUNC + "serverId: " + serverId);
    logger.info(FUNC + "goodsId: " + goods_id);
    logger.info(FUNC + "goodsNumber: " + goods_number);
    logger.info(FUNC + "sign: " + sign);

    let sql = '';
    sql += 'UPDATE `tbl_order` ';
    sql += 'SET `status`=?, `channel_order_id`=?, `channel_account_id`=?, `goods_id`=?, `goods_number`=?, `money`=?, `channel_cb`=?, `channel`=? ';
    sql += 'WHERE game_order_id=?';
    logger.info(FUNC + 'sql: ', sql);

    let sql_data = [
        0,
        channel_order_id,
        channel_account_id,
        goods_id,
        goods_number,
        money,
        JSON.stringify(channel_cb),
        channel,
        game_order_id
    ];

    pool.query(sql, sql_data, function (err, result) {
        if (err) {
            logger.error(FUNC + '[ERROR] err:', err);
        } else {
            logger.info(FUNC + 'result: ', result);
            cb(null, "ok");
        }
    });
}

/**
 * 增加一条商城流水记录
 */
function addShopLog(data, account, cb) {
    const FUNC = TAG + "addShopLog() --- ";
    let account_id = data['account_id'];
    let token = data['token'];
    let item_id = data['item_id'];
    let item_type = data['item_type'];
    let item_amount = data['item_amount'];
    let total = data['total'];
    let game_order_id = data['game_order_id'];

    // 错误检验
    if (account_id == null) {
        cb(new Error('接口调用请传参数account_id(玩家ID)'));
        return;
    }
    if (token == null) {
        cb(new Error('接口调用请传参数token'));
        return;
    }
    if (item_id == null) {
        cb(new Error('接口调用请传参数item_id(商品ID)'));
        return;
    }
    if (item_type == null) {
        let err_msg = '接口调用请传参数item_type(商品类型';
        err_msg += ': 礼品-' + ITEM_TYPE.IT_GIFT;
        err_msg += ', 金币-' + ITEM_TYPE.IT_GOLD;
        err_msg += ', 钻石-' + ITEM_TYPE.IT_PEARL;
        err_msg += ', 月卡-' + ITEM_TYPE.IT_CARD;
        err_msg += ', 翻盘-' + ITEM_TYPE.IT_FUND;
        err_msg += ')';
        cb(new Error(err_msg));
        return;
    }
    if (item_amount == null) {
        cb(new Error('接口调用请传参数item_amount(商品数量)'));
        return;
    }
    if (total == null) {
        cb(new Error('接口调用请传参数total(当前拥有的该类商品总量，用于校验)'));
        return;
    }
    //if (game_order_id == null) {
    //    cb(new Error('接口调用请传参数game_order_id(游戏订单号, 用于和订单表进行一一对应)'));
    //    return;
    //}

    item_id = parseInt(item_id);
    item_type = parseInt(item_type);
    item_amount = parseInt(item_amount);
    total = parseInt(total);

    if (isNaN(item_id)) {
        cb(new Error('item_id字段请勿输入非数值'));
        return;
    }
    if (isNaN(item_type)) {
        cb(new Error('item_type字段请勿输入非数值'));
        return;
    }
    if (item_type != ITEM_TYPE.IT_GIFT) {
        // 非礼包才判断是否为数值
        if (isNaN(item_amount)) {
            cb(new Error('item_amount字段请勿输入非数值'));
            return;
        }
        if (isNaN(total)) {
            cb(new Error('total字段请勿输入非数值'));
            return;
        }
    }

    // 检查账户的合法性
    logger.info(FUNC + "card:", account.card);
    _didAddShopLog(data, account, cb);
}

// 根据传入的item_type获取配置文件的导入路径
function _getCfgPath(item_type) {
    const FUNC = TAG + "_getCfgPath() --- ";

    let cfg_path = null;
    switch (item_type) {
        case ITEM_TYPE.IT_GIFT:
            logger.info(FUNC + "ITEM_TYPE.IT_GIFT");
            cfg_path = 'shop_gift_cfg';
            break;
        case ITEM_TYPE.IT_GOLD:
            logger.info(FUNC + "ITEM_TYPE.IT_GOLD");
            cfg_path = 'shop_buygold_cfg';
            break;
        case ITEM_TYPE.IT_PEARL:
            logger.info(FUNC + "ITEM_TYPE.IT_PEARL");
            cfg_path = 'shop_pearl_cfg';
            break;
        case ITEM_TYPE.IT_CARD:
            logger.info(FUNC + "ITEM_TYPE.IT_CARD");
            cfg_path = 'shop_card_cfg';
            break;
        case ITEM_TYPE.IT_FUND:
            logger.info(FUNC + "ITEM_TYPE.IT_FUND");
            cfg_path = 'shop_fund_cfg';
            break;
        default:
            logger.info(FUNC + "item_type错误, 默认使用shop_pearl_cfg...");
            cfg_path = 'shop_pearl_cfg';
            break;
    }

    return gameConfig[cfg_path];
}

// 验证后加入一条log
function _didAddShopLog(data, account, cb) {
    const FUNC = TAG + "_didAddShopLog() --- ";

    let nickname = (account.nickname != null);

    let account_id = data['account_id'];
    let item_id = data['item_id'];
    let item_type = data['item_type'];
    let item_amount = data['item_amount'];
    let total = data['total'];
    let game_order_id = data['game_order_id'];

    item_id = parseInt(item_id);
    item_type = parseInt(item_type);
    item_amount = parseInt(item_amount);
    if (isNaN(item_amount)) {
        // 组合礼包直接将此字段设置为1
        item_amount = 1;
    }
    total = parseInt(total);

    // TODO: 从shop_gold_cfg中查询对应ID的物品价格
    let price = 0;
    let cfg_list = _getCfgPath(item_type);
    for (let i = 0; i < cfg_list.length; i++) {
        let item = cfg_list[i];
        if (item.id == item_id) {
            // 区分倍率
            price = item.price * tools.BuzzUtil.getRmbTimes();
        }
    }

    let sql = '';
    sql += 'INSERT INTO `tbl_shop_log` ';
    sql += '(`account_id`,`item_id`,`item_type`,`item_amount`, `price`, `nickname`, `order_id`) ';
    sql += 'VALUES (?,?,?,?,?,?,?)';
    logger.info(FUNC + 'sql: ', sql);

    let sql_data = [account_id, item_id, item_type, item_amount, price, nickname, game_order_id];

    mysqlConnector.query(sql, sql_data, function (err, result) {
        if (err) {
            logger.error(FUNC + '[ERROR] err:\n', err);
            cb(err);
        } else {
            logger.info(FUNC + 'result: ', result);

            _updateAccountRmb(account_id, price, account, function (err_update_rmb, result_update_rmb, charmPoint, charmRank) {
                logger.info('------DD---charmPoint = ', charmPoint, charmRank);
                if (err_update_rmb) {
                    logger.info(FUNC + "err_update_rmb");
                    cb(err_update_rmb);
                    return;
                }
                logger.info(FUNC + "item_type: " + item_type);

                if (item_type == ITEM_TYPE.IT_GIFT) {
                    _updateItem(data, account, cb);
                } else if (item_type == ITEM_TYPE.IT_GOLD) {
                    _updateGoldTable(data, account, cb);
                } else if (item_type == ITEM_TYPE.IT_PEARL) {
                    _updatePearlTable(data, account, cb);
                    //给邀请者发邮件奖励(10%)
                    _mailMyInvitorWhenChargeSuccess(data, cfg_list, account);
                } else if (item_type == ITEM_TYPE.IT_CARD) {
                    _updateCardData(data, account, cfg_list, cb);
                } else if (item_type == ITEM_TYPE.IT_FUND) {
                    _updateFundData(data, account, cb);
                } else {
                    let errInfo = "不支持的商品类型(";
                    errInfo += "礼品-" + ITEM_TYPE.IT_GIFT;
                    errInfo += "|金币-" + ITEM_TYPE.IT_GOLD;
                    errInfo += "|珍珠-" + ITEM_TYPE.IT_PEARL;
                    errInfo += "|月卡-" + ITEM_TYPE.IT_CARD;
                    errInfo += "|翻盘-" + ITEM_TYPE.IT_FUND;
                    errInfo += ")";
                    logger.info(FUNC + errInfo);
                    cb(new Error(errInfo));
                }
            });
        }
    });
}

/**
 * 当我充值成功时, 向我的邀请者发送一封奖励邮件(10%我充值的钻石数).
 * @param data 可获取uid, item_id
 */
function _mailMyInvitorWhenChargeSuccess(data, shop_pearl_cfg, account) {
    const FUNC = TAG + "_mailMyInvitorWhenChargeSuccess() --- ";
    //--------------------------------------------------------------------------

    if (account.who_invite_me != 0) {
        let who_invite_me = account.who_invite_me;
        let uid = data['account_id'];
        let item_id = data['item_id'];

        let item = getItemFromShopCfg(item_id, shop_pearl_cfg);
        if (item) {
            let pearl_num = item.item;
            let pearl_num_mail = pearl_num / 10;
            // 向who_invite_me发送邮件.
            logger.info("向玩家" + who_invite_me + "发送奖励邮件");

            data = {
                title: "奖励邮件",
                content: "你的好友充值" + pearl_num + "钻, 你作为邀请者获得奖励" + pearl_num_mail + "钻",
                reward: '[["i002",' + pearl_num_mail + ']]',
                type: MAIL_TYPE.SPECIFY,
                player_list: "" + who_invite_me,
            };
            DaoMail.sendMail(mysqlConnector, data, function (err, result) {
                logger.info(FUNC + "err:", err);
                logger.info(FUNC + "result:", result);
            });
        }
    } else {
        logger.info("没有邀请者, 什么都不用做");
    }
}

/**
 * 查询shop表中的元素.
 */
function getItemFromShopCfg(item_id, cfg) {
    for (let idx in cfg) {
        let item = cfg[idx];
        if (item.id == item_id) {
            return item;
        }
    }
    return null;
}

// 更新tbl_account中的rmb字段
function _updateAccountRmb(uid, price, account, cb) {
    const FUNC = TAG + "_updateAccountRmb() --- ";
    logger.info(FUNC + "price:", price);

    let prev_vip = account.vip;
    let prev_rmb = account.rmb;
    let prev_pfft = account.pfft_at;
    let curr_rmb = prev_rmb + price;
    let curr_vip = prev_vip;
    for (let key in vip_vip_cfg) {
        let value = vip_vip_cfg[key];
        let times = tools.BuzzUtil.getRmbTimes();// 区分倍率
        if (value.vip_unlock * times <= curr_rmb) {
            curr_vip = value.vip_level;
        }
    }
    account.rmb = curr_rmb;
    if (prev_pfft == null) {
        account.pfft_at = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
    }
    if (curr_vip > prev_vip) {
        account.vip_daily_reward = 0;
    }
    account.commit();
    let cpoint = -1;
    let crank = -1;
    CacheAccount.setVip(account, curr_vip, function (chs) {
        if (chs && chs.length == 2) {
            chs[0] != null && chs[0] >= 0 && (cpoint = chs[0]);
            chs[1] != null && chs[1] >= 0 && (crank = chs[1]);
        }
        cb(null, 1, cpoint, crank);
    });
}

function _getAccountRmb(uid, cb) {
    let sql = '';
    sql += 'SELECT `vip`, `rmb`, `pfft_at` ';
    sql += 'FROM `tbl_account` ';
    sql += 'WHERE `id`=?';
    logger.info('sql: ', sql);

    let sql_data = [uid];
    mysqlConnector.query(sql, sql_data, function (err, result) {
        if (err) {
            logger.error('[ERROR] dao_shop._getAccountRmb()');
            logger.error(JSON.stringify(err));
        }
        cb(err, result);
    });
}

/**
 * 更新限时礼包，注意礼包内容可包含金币、钻石、技能等
 */
function _updateItem(data, account, cb) {
    const FUNC = TAG + "_updateItem() --- ";
    let account_id = data['account_id'];
    let item_amount = data['item_amount'];
    if (account && item_amount && item_amount.length > 0) {
        dao_reward.getReward(account, item_amount, function (err, result) {
            if (err) {
                logger.error(FUNC + " err:\n", err);
                return;
            }
            cb(null, [account]);
        });
    } else {
        logger.info(FUNC + '商城限时礼包数据有误，无法更新缓存数据.');
    }


}

// 更新tbl_gold表中的current_total, shop_count, shop_amount字段
function _updateGoldTable(data, account, cb) {
    const FUNC = TAG + "_updateGoldTable() --- ";
    let uid = data['account_id'];
    let item_id = data['item_id'];
    let item_type = data['item_type'];
    let item_amount = data['item_amount'];
    let total = data['total'];

    item_id = parseInt(item_id);
    item_type = parseInt(item_type);
    item_amount = parseInt(item_amount);
    total = parseInt(total);
    logger.info(FUNC + "total: " + total);

    //--------------------------------------------------------------------------
    // 更新缓存中的数据(重要:数据库操作将会被删除)
    //--------------------------------------------------------------------------
    let inc_gold = total - account.gold;
    if (inc_gold > 0) {
        account.gold = inc_gold;
    }

    //--------------------------------------------------------------------------

    let sql = '';
    sql += 'UPDATE `tbl_account` a, `tbl_gold` g ';
    sql += 'SET g.`current_total`=?, g.`shop_count`=`shop_count`+1, g.`shop_amount`=`shop_amount`+?, a.`gold`=? ';
    sql += 'WHERE g.`account_id`=? AND a.`id`=?';
    let sql_data = [total, item_amount, total, uid, uid];

    logger.info(FUNC + 'sql: ', sql);
    logger.info(FUNC + 'sql_data: ', sql_data);

    mysqlConnector.query(sql, sql_data, function (err, result) {
        if (err) {
            logger.error(FUNC + 'err:', err);
            cb(err);
        } else {
            logger.info(FUNC + 'gold result: ', result);
            // DONE: 需要返回用户数据更新客户端界面
            cb(null, [account]);
        }
    });
}

// 更新tbl_pearl表中的current_total, shop_count, shop_amount字段
function _updatePearlTable(data, account, cb) {
    const FUNC = TAG + "_updatePearlTable() --- ";

    let item_amount = data['item_amount'];
    item_amount = parseInt(item_amount);

    let coinId = shop_shop_buy_type_cfg.BUY_RMB.id;
    BuzzUtil.addCoin(account, coinId, item_amount, function (err, res) {
        cb(null, [account]);
    });
}

// 更新tbl_account的card字段以及common_const_cfg中配置的月卡获取物品
function _updateCardData(data, account, cfg_list, cb) {
    const FUNC = TAG + "_updateCardData() --- ";
    logger.info(FUNC + "CALL ...");

    let item_id = data['item_id'];

    item_id = parseInt(item_id);
    let start_date = DateUtil.format(new Date(), 'yyyy-MM-dd');
    logger.info(FUNC + "start_date = " + start_date);

    // 普通月卡
    if (item_id == 100) {
        logger.info(FUNC + "CALL _updateNormalCard()");
        _updateNormalCard(account, cb, start_date, cfg_list[0]);
    } else if (item_id == 101) {
        logger.info(FUNC + "CALL _updateSeniorCard");
        _updateSeniorCard(account, cb, start_date, cfg_list[1]);
    } else if (item_id == 102) {
        logger.info(FUNC + "CALL __updateWeekCard");
        _updateWeekCard(account, cb, start_date, cfg_list[2]);
    }else {
        // TODO: 不支持的月卡类型，错误提示
        let err_msg = '[ERROR] dao_shop._updateCardData(): 不支持的月卡类型';
        logger.error(err_msg);
        cb(err_msg);
    }
    // TODO
}

function _updateFundData(data, account, cb) {
    let total = data['total'];
    account.gold = total;
    account.commit();
    cb(null, [account]);
}

// 更新tbl_account中的card.normal以及common_const_cfg中配置的普通月卡获取物品
function _updateNormalCard(account, cb, start_date, update_items) {
    _updateCardCommon(account, cb, start_date, update_items, "normal");
}

// 更新tbl_account中的card.senior以及common_const_cfg中配置的壕月卡获取物品
function _updateSeniorCard(account, cb, start_date, update_items) {
    _updateCardCommon(account, cb, start_date, update_items, "senior");
}

function _updateWeekCard(account, cb, start_date, update_items) {
    _updateCardCommon(account, cb, start_date, update_items, "week");
}

function _updateCardCommon(account, cb, start_date, update_items, card_type) {
    const FUNC = TAG + "_updateCardCommon() --- ";

    logger.info(FUNC + "dao_shop._update_" + card_type + "Card()");

    let accOldCard = account.card;

    let newCard = {};
    accOldCard.normal && (newCard.normal = accOldCard.normal);
    accOldCard.senior && (newCard.senior = accOldCard.senior);
    accOldCard.week && (newCard.week = accOldCard.week);
    newCard[card_type] = {
        "start_date": start_date
    };

    //获取cfg_list中需要更新的物品
    logger.info(FUNC + 'update_items: ', update_items);

    account.pearl = update_items["diamond"];

    CacheAccount.setCard(account, newCard, cb);

}

function hasCard(card_type, account) {
    let card = account.card;
    let hasCard = false;
    if (card_type == 100 && card.normal) {
        hasCard = true;
    } else if (card_type == 101 && card.senior) {
        hasCard = true;
    } else if (card_type == 102 && card.week) {
        hasCard = true;
    }
    return hasCard;
}