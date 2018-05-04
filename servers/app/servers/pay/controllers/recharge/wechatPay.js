const Pay = require('./pay');
const WechatApi = require('./sdk/wechatApi');
const dao_shop = require('../../src/dao/dao_shop');
const ERROR_OBJ = require('../../../../consts/fish_error').ERROR_OBJ;

class WechatPay extends Pay{
    constructor(config) {
        super();
        this._wechatApi = new WechatApi(config);
    }

    async start(){
        await this._wechatApi.init();
    }
    async buyByRMB(data) {
        data.bill_no = data.orderid;
        let shopItemInfo = this._getShopItemInfo(data.orderInfo.goods_id, data.orderInfo.item_type);
        if(!shopItemInfo){
            throw ERROR_OBJ.BUY_WRONG_SHOP_ID;
        }
        data.amt = shopItemInfo.price;//TODO

        try{
            let sdkRet = await this._wechatApi.callBuy(data);
            logger.error('微信支付成功 sdkRet=', sdkRet);
            await dao_shop.updateOrderInfo(data.orderid, {money:data.amt, status:Pay.ORDER_STATUS.SUCCESS, channel_cb:JSON.stringify(sdkRet)});
            let result = await this.buySuccess(data, data.orderInfo.goods_id, data.orderid,data.orderInfo.item_type);
            for(let key in sdkRet) {
                result[key] = sdkRet[key];
            }
            return result;
        }catch(err){
            logger.error('微信渠道支付失败:', err);
            await dao_shop.updateOrderInfo(data.orderid, {status:Pay.ORDER_STATUS.FAIL, channel_cb:JSON.stringify({err:err})});
            throw err;
        }

    }
}

module.exports = WechatPay;