const ORDER = require('../../configs/consts/Cik');
const SQL_CONFIG = require('../../configs/sql');
const tools = require('../../../../utils/tools');

/**
 * 获取玩家账户数据
 * @param {*} data {orderId:100}
 */
exports.get = async function (data, ctx) {
    logger.error('data:', data);

    try {
        await confirmCash(data.orderId, data.info);
        return {
            result: true
        };
    }
    catch (err) {
        return {
            result: false,
            err: err.toString()
        };
    }
};

/**
 * 
 * @param {*} orderId 
 * @param {*} info 
 * catalog=1, info={serial:*, password:*}
 * catalog=2, info={way:*, thingnum:*}
 */
async function confirmCash(orderId, info) {
    let order = (await tools.SqlUtil.query(SQL_CONFIG.getChangeLogByOrderId, [orderId]))[0];
    if (!order) {
        const errMsg = `订单不存在:${orderId}`;
        logger.error(errMsg);
        throw new Error(errMsg);
    }
    logger.error('order:', order);

    if (ORDER.CATALOG.CARD == order.catalog) {
        if (ORDER.STATUS.CONFIRM == order.status) {
            if (tools.BuzzUtil.isVersionCikByHand()) {
                if (!info.serial || !info.password) {
                    const errMsg = `请填写卡号和卡密`;
                    logger.error(errMsg);
                    throw new Error(errMsg);
                }
                await setCard(orderId, info.serial, info.password);
            }
            else {
                await buyCard(orderId, order);
            }
        }
        else {
            const errMsg = `订单状态不允许领取充值卡:${order.status}`;
            logger.error(errMsg);
            throw new Error(errMsg);
        }
    }
    else if (ORDER.CATALOG.REAL == order.catalog) {
        if (!info.way || !info.thingnum) {
            const errMsg = `请填写物流公司名称和单号`;
            logger.error(errMsg);
            throw new Error(errMsg);
        }
        await setWayAndNum(orderId, info.way, info.thingnum);
    }
    else {
        const errMsg = `不能进行确认操作的物品:${order.catalog}`;
        logger.error(errMsg);
        throw new Error(errMsg);
    }
}

async function setCard(orderid, card_num, card_pwd) {
    await setSendSuccess(orderid);
    await tools.SqlUtil.query(SQL_CONFIG.updateCard, [card_num, card_pwd, orderid]);
}

async function setReceiverAndAddress(orderid, receiver, address) {
    await setSendSuccess(orderid);
    await tools.SqlUtil.query(SQL_CONFIG.updateReceiverAndAddress, [receiver, address, orderid]);
}

async function setWayAndNum(orderid, way, num) {
    await setSendSuccess(orderid);
    await tools.SqlUtil.query(SQL_CONFIG.updateWayAndNum, [way, num, orderid]);
}

async function setSendSuccess(orderid) {
    let shiptime = tools.DateUtil.format(new Date(), tools.DateUtil.FMT.DT);
    await tools.SqlUtil.query(SQL_CONFIG.updateStatus, [ORDER.STATUS.SENDSUCCESS, orderid]);
    await tools.SqlUtil.query(SQL_CONFIG.updateShiptime, [shiptime, orderid]);
}

async function buyCard(orderid, order) {
    let api = '/admin_api/buy_card';
    // let host = '127.0.0.1';
    // let port = '1337';//local
    let data = {
        orderid: orderid,
        uid: order.uid,
        cid: order.cid,
    };
    logger.error('data:', data);
    let resultString = await tools.HttpUtil.post(api, ORDER.PAY_SERVER_IP, ORDER.PAY_SERVER_PORT, data);
    logger.error('resultString:', resultString);
    let result = JSON.parse(resultString.toString());
    let err = result.err;
    if (err) {
        logger.error('err:', err);
        throw err;
    }
    else {
        logger.error('获取卡号卡密成功');
        let retData = result.data;
        let card_num = retData.card_num;
        let card_pwd = retData.card_pwd;
        await setCard(orderid, card_num, card_pwd);
    }
}