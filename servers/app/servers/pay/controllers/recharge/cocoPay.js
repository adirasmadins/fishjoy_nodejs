const Pay = require('./pay');
const api = require('./sdk/cocoApi');
const dao_shop = require('../../src/dao/dao_shop');
const ERROR_OBJ = require('../../../../consts/fish_error').ERROR_OBJ;
const redisAccountSync = require('../../../../utils/redisAccountSync');

class CocoPay extends Pay {
    constructor(config) {
        super();
        this._api = new api(config);
    }

    async buyByRMB(data) {
        let account = data.account;
        let order = await dao_shop.getOrderInfo(data.orderid);
        logger.error("buyByRMB:", order);
        if (order.status == Pay.ORDER_STATUS.SUCCESS) {
            let itemList = order.item_list;
            itemList = JSON.parse(itemList);
            return {
                game_order_id: data.orderid,
                item_list: itemList,
                change: {
                    gold: account.gold,
                    pearl: account.pearl,
                    vip: account.vip,
                    rmb: account.rmb,
                    vip_gift: account.vip_gift,
                    vip_daily_reward: account.vip_daily_reward,
                    card: account.card,
                    get_card: account.get_card,
                    first_buy: account.first_buy,
                    activity_gift: account.activity_gift,
                    gold_shopping: account.gold_shopping,
                    charm_point: account.charm_point,
                    charm_rank: account.charm_rank,
                    comeback: account.comeback

                }

            };
        }
        throw ERROR_OBJ.ORDER_PAY_FAIL;
    }

    async callback(data) {
        logger.error("回调参数:", data);
        let product_uid = data.uid;
        let rmb = data.rmb;
        let reqid = data.reqid;
        let trans_id = data.trans_id;
        let product_id = data.product_id;
        let notify_id = data.notify_id;
        let userdata = data.userdata;
        let orderId = data.txid;
        let sign = data.sign;

        let newVar = await dao_shop.getOrderInfo(orderId);
        if (newVar.status == 0) {
            logger.error("coco支付错误,订单已处理", newVar);
            return api.SUCCESS;
        }
        let itemid = newVar.goods_id;
        let itemtype = newVar.item_type;
        let uid = newVar.game_account_id;
        try {
            await this._api.paymentVerify(data);
            await dao_shop.updateOrderInfo(orderId, {
                money: rmb,
                status: Pay.ORDER_STATUS.SUCCESS,
                channel_cb: JSON.stringify({data}),
                channel_order_id: trans_id,
            });
            data.uid = uid;
            data.account = await redisAccountSync.getAccountAsync(uid);
            data.token = data.account.token;
            let res = await this.buySuccess(data, itemid, orderId, itemtype);
            let item_list = res.item_list;
            await dao_shop.updateOrderInfo(orderId, {
                item_list: JSON.stringify({item_list})
            });
            return api.SUCCESS;
        } catch (err) {
            logger.error("coco回调错误:", err);
            logger.error("coco回调数据:", data);
            await dao_shop.updateOrderInfo(orderId, {
                status: Pay.ORDER_STATUS.FAIL,
                channel_cb: JSON.stringify({err: err})
            });
            return api.FAIL;
        }
    }

}

module.exports = CocoPay;