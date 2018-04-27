const redisAccountSync = require('../../utils/redisAccountSync');

class GenAccount {
    constructor() {
        this._apiCfgMap = new Map();
    }

    async getAccount(uid, url) {
        let apiCfg = this._apiCfgMap.get(url);
        if (!apiCfg) {
            return;
        }

        if (!apiCfg.accountFields) {
            return;
        }

        return await redisAccountSync.getAccountAsync(uid, apiCfg.accountFields);
    }

    checkParams(url, reqData) {
        let apiCfg = this._apiCfgMap.get(url);
        if (apiCfg && apiCfg.requireParams && apiCfg.requireParams.length > 0) {
            let requireParams = apiCfg.requireParams;
            for (let i = 0; i < requireParams.length; i++) {
                if (reqData[requireParams[i]] == undefined || reqData[requireParams[i]] == null) {
                    return false;
                }
            }
        }
        return true;
    }

    registeApiCfg(url, apiCfg) {
        if (!apiCfg) return;
        this._apiCfgMap.set(url, apiCfg);
    }
}

module.exports = new GenAccount();