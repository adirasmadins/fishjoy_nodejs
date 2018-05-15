const ERROR_OBJ = require('../../../../../consts/fish_error').ERROR_OBJ;
const PLATFORM_TYPE = require('../../../../../consts/constDef').PLATFORM_TYPE;
const crypto = require("crypto");
const _ = require('underscore');
const httpclient = require('../../../../../net/httpclient');
const util = require('util');

class WechatApi {
    constructor(config) {
        this._config = config;
        this._access_token = null;
        this._access_token_timer = null;

    }

    async init(){
        await this._updateAccessToken();
    }

    //定时刷新token
    async _updateAccessToken(){
        await this._getAccessToken();
        let self = this;
        this._access_token_timer = setInterval(async function () {
            await self._getAccessToken();
        }, 7000000);
    }

    async _getAccessToken(){
        try {
            let resp = await httpclient.getData(util.format(this._config.getAccessToken, this._config.appid, this._config.appkey));
            resp = JSON.parse(resp);
            if(!resp.errcode && resp.access_token){
                this._access_token = resp.access_token;
                logger.error('this._access_token = ', resp);
            }else {
                throw resp;
            }
        }catch (err){
            logger.error('微信支付,获取access_token失败, err=', err);
            throw ERROR_OBJ.SDK_ACCESS_TOKEN_INVALID;
        }

    }

    _getPFTag(pfId) {
        switch (pfId) {
            case PLATFORM_TYPE.ANDROID:
                return 'android';
            default:
                throw ERROR_OBJ.NOT_SUPPORT_CHANNEL_PAY;
        }
    }

    _getSha256(sigStr, key){
        console.error('sigStr', sigStr);
        console.error('key', key);
        let sha256 = crypto.createHmac('sha256', key);
        sha256.update(sigStr);
        return sha256.digest('hex');
    }

    _sortObject(data) {
        // 对象转数组(_.pairs)
        // 数组排序(_.sortBy)
        let sortArr =  _.sortBy(_.pairs(data), function (item) {
            return item[0];
        });

        let sortObj = {};
        for(let i = 0; i< sortArr.length; i++){
            sortObj[sortArr[i][0]] = sortArr[i][1];
        }
        return sortObj;
    }

    _buildPayBody(data){
        console.error('data=',data);
        let sdkData = {
            openid: data.account.channel_account_id,
            appid: this._config.appid,
            offer_id: this._config.offer_id,
            ts: Number.parseInt(Date.now()/1000),
            zone_id: '1',
            pf: this._getPFTag(data.account.platform),
            amt: 1,//TODO data.amt,
            bill_no: data.bill_no,
        };

        sdkData = this._sortObject(sdkData);
        console.error('sdkData=', sdkData);
        let sigOriStr = '';
        for(let key in sdkData){
            sigOriStr += `${key}=${sdkData[key]}&`;
        }
        sigOriStr = sigOriStr.substring(0, sigOriStr.length - 1);

        let org_loc = `${this._config.MIDASPAY_ORG_LOC}&method=POST`;
        sdkData.sig = this._getSha256(`${sigOriStr}&org_loc=${org_loc}&secret=${this._config.midas_appKey}`, this._config.midas_appKey);
        sdkData.access_token = this._access_token;

        sdkData = this._sortObject(sdkData);
        let mp_sigOriStr = '';
        for(let key in sdkData){
            mp_sigOriStr += `${key}=${sdkData[key]}&`;
        }
        mp_sigOriStr = mp_sigOriStr.substring(0, mp_sigOriStr.length - 1);

        sdkData.mp_sig = this._getSha256(`${mp_sigOriStr}&org_loc=${org_loc}&session_key=${data.account.extend.session_key}`, data.account.extend.session_key);
        return sdkData;
    }

    async callBuy(data) {

        let body = this._buildPayBody(data);
        try{
            let resp = await httpclient.postData(body, util.format(this._config.MIDASPAY, body.access_token));
            if(!resp){
                logger.error('微信支付返回数据为空');
                throw ERROR_OBJ.DATA_NULL_ERROR;
            }

            resp = JSON.parse(resp);
            if(resp.errcode == 90013){
                logger.error('微信支付失败,余额不足, err=', resp);
                throw ERROR_OBJ.AMOUNT_NOT_ENOUGH;
            }

            if(40001 == resp.errcode){
                this._access_token = null;
                clearInterval(this._access_token_timer);
                await this._updateAccessToken();
                return await this.callBuy(data);
            }

            if(resp.errcode != 0){
                logger.error('微信支付失败, err=', resp);
                if(resp.errmsg.search('余额不足') != -1){
                    throw {code:ERROR_OBJ.AMOUNT_NOT_ENOUGH.code, msg:resp.errmsg};
                }else{
                    throw {code:ERROR_OBJ.CALL_SDK_FAIL.code, msg:resp.errmsg};
                }
            }
            return resp;

        }catch (err){
            throw err;
        }

    }
}

//
// let api = new WechatApi();
// api.callBuy({
//     amt:12,
//     bill_no:'111034324234223423',
//     account:{
//         platform:1,
//         channel_account_id:'aaaaaaaaaaaaaaaaaaaaa',
//         extend:{
//             access_token:'erwerwerwerewrweq423423423423'
//         }
//     }
// });

module.exports = WechatApi;