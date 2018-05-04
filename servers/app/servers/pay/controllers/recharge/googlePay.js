const Pay = require('./pay');
const api = require('./sdk/googleApi');
const ERROR_OBJ = require('../../../../consts/fish_error').ERROR_OBJ;
const dao_shop = require('../../src/dao/dao_shop');

class GooglePay extends Pay {
    constructor(config) {
        super();
        this._api = new api(config);
    }

    async buyByRMB(data) {
        let res = await this._api.checkOrder(data);
        let orderId = res.developerPayload;
        let {goods_id, game_account_id, status, channel_order_id, item_type} = await dao_shop.getOrderInfo(orderId);
        if (status == 0) {
            logger.error(`此订单已经使用id${game_account_id},orderId:${orderId},status:${status},channel_order_id:${channel_order_id}`);
            throw ERROR_OBJ.ORDER_REPEAT;
        }
        data.orderId = orderId;
        data.item_id = goods_id;
        try {
            await dao_shop.updateOrderInfo(orderId, {
                money: 0,
                status: Pay.ORDER_STATUS.SUCCESS,
                channel_cb: JSON.stringify({res}),
                channel_order_id: res.orderId
            });
            return await this.buySuccess(data, goods_id, orderId, item_type);
        } catch (err) {
            logger.error("添加物品失败:", err);
            await dao_shop.updateOrderInfo(orderId, {
                status: Pay.ORDER_STATUS.FAIL,
                channel_cb: JSON.stringify({err: err})
            });
            throw ERROR_OBJ.ORDER_PAY_FAIL;
        }


    }

}

module.exports = GooglePay;