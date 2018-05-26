const SQL_CONFIG = require('../../configs/sql');
const REDISKEY = require('../../../../models/index').REDISKEY;
const tools = require('../../../../utils/tools');

// const MAIL_TITLE_TOPUP = '补偿邮件(uid,serial,gold)';
// const MAIL_CONTENT_TOPUP = '用户 uid 由于系统原因导致 serial 卡充值失败，特补偿金币 gold';

const MAIL_TITLE_TOPUP = 'Thông Báo(uid,serial,gold)';
const MAIL_CONTENT_TOPUP = '[uid]Các thuyền trưởng thân mến! Do hệ thống nạp thẻ cần thêm thời gian để điều chỉnh nên thuyền trưởng đã gặp trục trặc khi nạp thẻ <serial> . Chúng tôi sẽ hoàn lại gold vàng mà thuyền trưởng đã quy đổi. Chân thành xin lỗi và mong các thuyền trưởng cảm thông cho sự việc nêu trên. ';

/**
 * 获取实时数据接口需要的返回值
 * @param {*} data 
    {
        serial:'', 
        code:'', 
        money:20000, 
        gold:60000, 
        uid:512,
        delay:60
    }
 */
exports.get = async function (data, ctx) {
    logger.error('data:\n', data);
    let serial = data.serial;
    let code = data.code;
    let money = data.money;
    let gold = data.gold;
    let uid = data.uid;
    let addByWho = ctx.session.uid;

    checkParams(data);

    // 根据uid,serial,code查询充值记录
    let orderFail = await getOrderFail(uid, serial, code);

    if (orderFail) {
        logger.error('orderFail:', orderFail);
        let needUpdateRmb = true;
        for (let i = 0; i < orderFail.length; i++) {
            if (0 == orderFail[i].status) {
                needUpdateRmb = false;
                break;
            }
        }
        if (needUpdateRmb) {
            let rmb = await tools.RedisUtil.hincrby(REDISKEY.RMB, uid, money);
            let vip = await tools.RedisUtil.hset(REDISKEY.VIP, uid, tools.BuzzUtil.getVipFromRmb(rmb));
            logger.error('vip:', vip);
            logger.error('rmb:', rmb);
            await tools.SqlUtil.query(SQL_CONFIG.updateOrderStatus.replace('order_id', orderFail.id), [0]);
            await tools.SqlUtil.query(SQL_CONFIG.updateOrderMoney.replace('order_id', orderFail.id), [money]);
        }
    }

    // return { result: false, err: 'function in test' };

    let type = 2;
    let content = MAIL_CONTENT_TOPUP
        .replace('uid', uid)
        .replace('serial', serial)
        .replace('gold', gold);
    let title = MAIL_TITLE_TOPUP
        .replace('uid', uid)
        .replace('serial', serial)
        .replace('gold', gold);
    // let reward = '[["i001",' + gold + ']]';
    let reward = '[["i002",' + gold + ']]';//越南休闲版应该补充的是钻石
    let player_list = uid;
    let delay = data.delay;

    try {

        let result = await insertMail(type, content, reward, title, player_list, delay, addByWho);
        logger.error('result:\n', result);

        let insertId = result.insertId;
        let sql = "";
        sql += "UPDATE tbl_account ";
        sql += "SET mail_box = CASE ";
        sql += "WHEN mail_box IS NOT NULL AND LENGTH(TRIM(mail_box)) > 0 THEN ";
        sql += "    CONCAT(mail_box, ?) ";
        sql += "WHEN mail_box IS NULL OR (mail_box IS NOT NULL AND LENGTH(TRIM(mail_box)) < 1) THEN ";
        sql += "    ? ";
        sql += "END ";
        if (player_list) {
            sql += "WHERE id IN (" + player_list + ") ";
        }
        let sql_data = ["," + insertId, insertId];

        let play = player_list.split(',');

        for (let i = 0; i < play.length; i++) {
            let mail_box = await tools.RedisUtil.hget(REDISKEY.MAIL_BOX, play[i]);
            if (!mail_box) {
                await tools.RedisUtil.hset(REDISKEY.MAIL_BOX, play[i], "[" + insertId + "]");
            }
            else {
                let mail = JSON.parse(mail_box);
                if (typeof mail == 'object') {

                    mail.push(insertId);
                    await tools.RedisUtil.hset(REDISKEY.MAIL_BOX, play[i], JSON.stringify(mail));
                }
                else {
                    return { result: false, errorCode: this.app.config.ErrorCode.REDIS_ERROR_DATA };
                }
            }
        }
        await tools.SqlUtil.query(sql, sql_data);
        return { result: true, data: { id: insertId } };
    } catch (err) {
        console.log('err:', err);
        return { result: false, err: err };
    }
};

async function insertMail(type, content, reward, title, receiverUid, delay, addByWho) {
    let receiver = 1;
    // 计算生效时间
    let time = new Date().getTime() + delay * 1000;
    let validtime = tools.DateUtil.format(time, tools.DateUtil.FMT.DT);
    let sql_data = [type, content, reward, title, '[' + receiverUid + ']', receiver, validtime, addByWho];
    return await tools.SqlUtil.query(SQL_CONFIG.insertMail, sql_data);
}

function checkParams(data) {
    if (data.money * 3 != data.gold) {
        throw new Error('补偿金额不合法');
    }
}

/**
 * 返回失败第一个失败订单的id(如果没有返回null)
 * @param {*} uid 
 * @param {*} serial 
 * @param {*} code 
 */
async function getOrderFail(uid, serial, code) {
    let ret = await tools.SqlUtil.query(SQL_CONFIG.getOrderSpecific, [uid, serial, code]);
    console.log(ret);
    if (0 == ret.length) {
        throw new Error('没有找到符合条件的订单');
    }
    for (let i = 0; i < ret.length; i++) {
        let order = ret[i];
        if (0 == order.status) {
            logger.error(`玩家充值状态已经是成功的, 不需要处理vip等参数`);
            return null;
        }
    }
    logger.error(`查询到的订单数量:${ret.length}`);
    let firstOrder = ret[0];
    let orderTobeModified = {
        id: firstOrder.id
    };
    return orderTobeModified;
}
