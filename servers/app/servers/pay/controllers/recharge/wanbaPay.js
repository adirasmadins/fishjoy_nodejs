const Pay = require('./pay');
const WanbaApi = require('./sdk/wanba/wanbaApi');
const dao_shop = require('../../src/dao/dao_shop');
const ERROR_OBJ = require('../../../../consts/fish_error').ERROR_OBJ;

class WanbaPay extends Pay{
    constructor(config) {
        super();
        this._wanbaApi = new WanbaApi(config);
    }

    async buyByRMB(data) {
        let zoneid = data.zoneid ? data.zoneid : 1; // 默认值
        data.channelItemId = this._getFunId(data.itemid, data.itemtype, zoneid);
        if(data.channelItemId == -1){
            throw ERROR_OBJ.BUY_WRONG_SHOP_ID;
        }
        try{
            let sdkRet = await this._wanbaApi.callBuy(data);
            if(sdkRet.code != 0){
                await dao_shop.updateOrderInfo(data.orderid, {status:Pay.ORDER_STATUS.FAIL, channel_cb:JSON.stringify({err:sdkRet})});
                return  sdkRet;
            }else{
                let money = sdkRet.data[0].cost;
                await dao_shop.updateOrderInfo(data.orderid, {money:money, status:Pay.ORDER_STATUS.SUCCESS, channel_cb:JSON.stringify({})});
                let result = await this.buySuccess(data, data.itemid, data.orderid,data.itemtype);
                for(let key in sdkRet) {
                    result[key] = sdkRet[key];
                }
                return result;
            }
        }catch(err){
            logger.error('玩吧渠道支付失败:', err);
            await dao_shop.updateOrderInfo(data.orderid, {status:Pay.ORDER_STATUS.FAIL, channel_cb:JSON.stringify({err:err})});
            throw err;
        }

    }


    _getFunId(itemid, itemtype, zoneid) {
        let cfg = Pay.ITEM_TYPE_CFG_MAP[itemtype];
        for (let idx in cfg) {
            if (cfg[idx].id == itemid) {
                if (zoneid == 1) {
                    return cfg[idx].funid;
                }
                else if (zoneid == 2) {
                    return cfg[idx].funidiOS;
                }
            }
        }
        return -1;// 这会返回道具ID错误
    }
}

module.exports = WanbaPay;