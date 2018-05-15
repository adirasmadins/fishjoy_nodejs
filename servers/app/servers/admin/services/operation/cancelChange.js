const ORDER = require('../../configs/consts/Cik');
const SQL_CONFIG = require('../../configs/sql');
const tools = require('../../../../utils/tools');

const commonTxt = require('../../configs/locals/common');
const sendMail = require('../gamemgmt/sendMail');
const versions = require('../../../../../config/versions');

/**
 * 获取玩家账户数据
 * @param {*} data {orderId:100}
 */
exports.get = async function (data, ctx) {
    logger.error('data:', data);

    try {
        await cancelCash(data.orderId, ctx);
        return {
            result: true
        };
    }
    catch (err) {
        return {
            result: false,
            err: err
        };
    }
};

async function cancelCash(orderId, ctx) {
    let order = (await tools.SqlUtil.query(SQL_CONFIG.getChangeLogByOrderId, [orderId]))[0];
    if (!order) {
        const errMsg = `订单不存在:${orderId}`;
        logger.error(errMsg);
        throw new Error(errMsg);
    }
    logger.error('order:', order);

    if (ORDER.CATALOG.CARD == order.catalog) {
        if (ORDER.STATUS.CONFIRM == order.status) {
            logger.error('放弃领取充值卡');
            cancelCard(orderId, order, ctx);
        }
        else {
            const errMsg = `订单状态不允许领取充值卡:${order.status}`;
            logger.error(errMsg);
            throw new Error(errMsg);
        }
    }
    else if (ORDER.CATALOG.REAL == order.catalog) {
        logger.error('TODO:领取实物');
    }
    else {
        const errMsg = `不能进行确认操作的物品:${order.catalog}`;
        logger.error(errMsg);
        throw new Error(errMsg);
    }
}

async function cancelCard(orderid, order, ctx) {


    await tools.SqlUtil.query(SQL_CONFIG.updateStatus, [ORDER.STATUS.CANCEL, orderid]);
    // 取消订单后发送邮件返还玩家金币(越南版)
    if (versions.PUB == versions.GAMEPLAY.VIETNAM
        || versions.PUB == versions.GAMEPLAY.LOCAL//调试用
    ) {
        let i18n = ctx.session.i18n;
        const TXT = commonTxt[i18n];
        let mailData = {
            type: 3,
            title: TXT.txt_title_mail_cancel_cik,
            content: TXT.txt_content_mail_cancel_cik,
            reward: '[["i001", ' + order.cost + ']]',
            uid: '' + order.uid,
            delay: 60,
            addByWho: ctx.session.uid
        };
        let ret = await sendMail.get(mailData, ctx);
        // logger.error('ret:\n', ret);
    }
    // TODO:取消订单后立即返还玩家话费券(国内版)
    else if (tools.BuzzUtil.isVersionChina()) {

    }
}