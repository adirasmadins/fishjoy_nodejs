const payConfig = require('../../../../utils/imports').payConfig;
const constDef = require('../../../../consts/constDef');
const versions = require('../../../../utils/imports').versions;

class PaySdk {
    constructor() {
        this._sdkMap = new Map();
        this._init(versions.VER_KEY[versions.PUB]);
    }

    sdk(type) {
        return this._sdkMap.get(type);
    }

    _init(ver){
        let channelId = constDef.PAY_CHANNEL_ID[`${ver.toUpperCase()}PAY`];
        if(!channelId){
            logger.error('此版本无支付渠道id，注意检查版本');
            return;
        }

        try{
            const CLASS = require(`./${ver}Pay`);
            let sdk = new CLASS(payConfig);
            this._install(channelId, sdk);
        }catch (e){
            logger.error('此版本不支持渠道支付，注意检查支付接口', e);
        }
    }

    _install(type, sdk) {
        this._sdkMap.set(type, sdk);
    }
}

module.exports = new PaySdk();