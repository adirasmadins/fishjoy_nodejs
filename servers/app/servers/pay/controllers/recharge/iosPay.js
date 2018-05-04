const Pay = require('./pay');
const IosApi = require('./sdk/ios/iosApi');
const dao_shop = require('../../src/dao/dao_shop');
const ERROR_OBJ = require('../../../../consts/fish_error').ERROR_OBJ;

class IosPay extends Pay {
    constructor(config) {
        super();
        this._iosApi = new IosApi(config);
    }

    async buyByRMB(data) {
        let res = await dao_shop.getOrderInfo(data);
        data.itemid = res.goods_id;
        data.itemtype = res.item_type;

        let response = await this._iosApi.getOrder(data.receipt);
        if (response.code != 0) {
            logger.error("ios 支付失败:", response);
            throw ERROR_OBJ.ORDER_PAY_FAIL;
        }
        logger.info("ios sdk result:", response);

        this._iosApi.checkChannelName(response.bundle_id);
        let {product_id, product_money, product_name} = this._getGoodsInfo(data.itemtype, response.product_id);
        if (product_id == -1) {
            logger.error(`商品id有误，请查询${response.product_id}`);
            throw ERROR_OBJ.ORDER_ILLEGAL;
        }
        if (data.itemid != product_id) {
            logger.error(`商品购买有误，此订单购买的正确商品id应该为:${product_id},名称为:${response.product_id},中文名称:${product_name}`);
            data.itemid = product_id;
        }
        let order = await dao_shop.checkIOSOrder(response.billno);
        if (order) {
            let gameOrderId = order.game_order_id;
            let status = order.status;
            logger.error("订单重复,order:", order);
            logger.error(`重复订单:${gameOrderId},状态:${status}`);
            throw ERROR_OBJ.ORDER_REPEAT;
        }
        try {
            await dao_shop.updateOrderInfo(data.orderid, {
                money: product_money,
                status: Pay.ORDER_STATUS.SUCCESS,
                channel_cb: JSON.stringify({}),
                channel_order_id:response.billno
            });
            return await this.buySuccess(data, data.itemid, data.orderid,data.itemtype);
        } catch (err) {
            await dao_shop.updateOrderInfo(data.orderid, {
                status: Pay.ORDER_STATUS.FAIL,
                channel_cb: JSON.stringify({err: err})
            });
            throw ERROR_OBJ.ORDER_PAY_FAIL;
        }
    }

    _getGoodsInfo(itemtype, product_id) {
        let cfg = Pay.ITEM_TYPE_CFG_MAP[itemtype];
        for (let idx in cfg) {
            let cfg2 = cfg[idx];
            if (product_id == cfg2.iOS) {
                return {product_id: cfg2.id, product_money: cfg2.price, product_name: cfg2.name};
            }
        }
        return {product_id: -1, product_money: 0, product_name: ""};
    }

}

module.exports = IosPay;