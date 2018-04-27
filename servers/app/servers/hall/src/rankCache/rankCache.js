const Cache = require('./cache');
const RedisUtil = require('../../src/utils/RedisUtil');
const conf = require("./cacheConf").rank;


const PLATFORM_TYPE = {
    ANDROID: 1,
    IOS: 2
};

class RankCache extends Cache {
    constructor(conf) {
        super(conf);
    }

    _update() {
        let sub = this.conf.sub;
        for (let i in sub) {
            let key = sub[i].redis_key;
            let type = sub[i].type;
            for(let platform of Object.values(PLATFORM_TYPE)) {
                RedisUtil.get(`${key}:${platform}`, function (err, res) {
                    if (err) {
                        logger.error(`update ${key} RankCache`, err);
                    }
                    Cache.all_charts[platform][type] = JSON.parse(res);
                });
            }
        }
    }
}

module.exports = new RankCache(conf);