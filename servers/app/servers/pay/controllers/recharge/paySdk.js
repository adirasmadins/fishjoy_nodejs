const payConfig = require('../../../../utils/imports').payConfig;
const constDef = require('../../../../consts/constDef');
const versionsUtil = require('../../../../utils/imports').versionsUtil;

class PaySdk {
    init(){
        this._sdkMap = new Map();
        let ver = versionsUtil.getVerKey();
        let channelId = constDef.PAY_CHANNEL_ID[`${ver.toUpperCase()}PAY`];
        if(!channelId){
            logger.error('此版本无支付渠道id，注意检查版本');
            return;
        }
        try{
            let CLASS = require(`./${ver}Pay`);
            if(versionsUtil.isDevelopment()){
                CLASS = require('./localPay');
            }

            let sdk = new CLASS(payConfig);
            sdk.start && sdk.start();
            this._install(channelId, sdk);
        }catch (e){
            logger.error('此版本不支持渠道支付，注意检查支付接口', e);
        }
    }

    sdk(type) {
        return this._sdkMap.get(type);
    }

    _install(type, sdk) {
        this._sdkMap.set(type, sdk);
    }
}

module.exports = new PaySdk();