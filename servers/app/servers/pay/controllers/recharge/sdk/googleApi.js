const Api = require('./api');
const ERROR_OBJ = require('../../../../../consts/fish_error').ERROR_OBJ;

class GoogleApi extends Api {

    constructor(config) {
        super();
        this._config = config;
        this._setToken();
    }

    async checkOrder(data) {
        let res = await this._httpsGet(this.getUrl(data));
        let consumptionState = res.consumptionState;
        let purchaseState = res.purchaseState;
        if (consumptionState == 1 && purchaseState == 0) {
            return res;
        } else {
            logger.error("支付失败:", res);
            throw ERROR_OBJ.ORDER_PAY_FAIL;
        }
    }

    getUrl(data) {
        return `${this._config.url}/${data.packageName}/purchases/products/${data.productId}/tokens/${data.goodToken}?access_token=${GoogleApi.ACCESS_TOKEN}`;
    }

    async _refreshToken() {
        let options = {
            grant_type: GoogleApi.GRANT_TYPE.refresh,
            client_id: this._config.client_id,
            client_secret: this._config.client_secret,
            refresh_token: this._config.refresh_token
        };
        try {
            let resp = await this._httpsPost(options, this._config.tokenUrl, this._config.tokenPath);
            resp = JSON.parse(resp);
            if (resp.access_token) {
                GoogleApi.ACCESS_TOKEN = resp.access_token;
                logger.error('刷新令牌成功:', GoogleApi.ACCESS_TOKEN);
            } else {
                logger.error('令牌刷新失败!!!', resp);
            }
            return true;
        } catch (err) {
            return false;
        }
    }

    async _setToken() {
        let bool = await this._refreshToken();
        setTimeout(this._setToken.bind(this), bool ? 1000 * 60 * 50 : 1000 * 10);
    }
}

GoogleApi.GRANT_TYPE = {
    refresh: 'refresh_token',
    code: 'authorization_code',
};

GoogleApi.ACCESS_TOKEN = '';

module.exports = GoogleApi;