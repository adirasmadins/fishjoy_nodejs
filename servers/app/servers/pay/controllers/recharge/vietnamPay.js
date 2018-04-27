const Pay = require('./pay');
const dao_shop = require('../../src/dao/dao_shop');
const gameConfig = require('../../../../utils/imports').DESIGN_CFG;
const shop_businesstype_cfg = gameConfig.shop_businesstype_cfg;
const ERROR_OBJ = require('../../../../consts/fish_error').ERROR_OBJ;
const VietnamApi = require('./sdk/vietnam/vietnamApi');
const BuzzUtil = require('../../src/utils/BuzzUtil');

class VietnamPay extends Pay {
    constructor(config) {
        super();
        this._veitnamApi = new VietnamApi(config);
    }

    async buyByRMB(data) {

        if (data.payData == null || data.payData.cardType == null || data.payData.cardSerial == null || data.payData.cardCode == null) {
            throw ERROR_OBJ.PARAM_MISSING;
        }
        let cardBusinessInfo = this._getCardBusinessInfo(data.payData.cardType);
        data.cardType = cardBusinessInfo.business_usecard;
        data.cardSerial = data.payData.cardSerial;
        data.cardCode = data.payData.cardCode;

        await dao_shop.updateOrderInfo(data.orderid, {
            channel_account_id: data.openid,
            card_serial: data.cardSerial,
            card_code: data.cardCode
        });

        let amount = null;
        try {
            amount = await this.callSdk(data);
        } catch (err) {
            logger.error('越南渠道支付失败:', err);
            await dao_shop.updateOrderInfo(data.orderid, {
                status: Pay.ORDER_STATUS.FAIL,
                channel_cb: JSON.stringify({err: err})
            });
            err.code = ERROR_OBJ.ORDER_PAY_FAIL.code;
            throw err;
        }

        await dao_shop.updateOrderInfo(data.orderid, {money: amount});

        let shop_gold = BuzzUtil.getShopGoldByAmount(amount);
        if (!shop_gold) {
            throw ERROR_OBJ.CARD_AMOUNT_WRONG;
        }

        await dao_shop.updateOrderInfo(data.orderid, {
            goods_name: shop_gold.name,
            status: Pay.ORDER_STATUS.SUCCESS,
            channel_cb: JSON.stringify({}),
            goods_id: shop_gold.id
        });

        return await this.buySuccess(data, shop_gold.id, data.orderid, data.itemtype);
    }


    async callSdk(data) {
        let amount = await this._veitnamApi.useCard(data.cardCode, data.cardSerial, data.cardType, data.uid.toString(), data.orderid);
        return amount;
    }

    getGoodsName(shop_id) {
        return "Thẻ nạp tiền";
    }

    getGoodsId(goods_id) {
        return -1;
    }

    _getCardBusinessInfo(cardType) {
        let cardTypeInfo = shop_businesstype_cfg[cardType];
        if (!cardTypeInfo) {
            throw ERROR_OBJ.CARD_TYPE_WRONG;
        }
        return cardTypeInfo;
    }
}

module.exports = VietnamPay;