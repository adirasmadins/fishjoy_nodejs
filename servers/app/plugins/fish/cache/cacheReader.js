const omelo = require('omelo');
const redisKey = require('../../../database/index').dbConsts.REDISKEY;

class CacheReader{
    constructor(cache){
       this._data = new Map();
       this._cache = cache;
       logger.error('-----------------CacheReader');
    }

    //读取平台抽水系数
    get pumpwater(){
        return this._cache.get(redisKey.PLATFORM_DATA.PUMPWATER);
    }

    //读取平台捕获率
    get platformCatchRate(){
        return this._cache.get(redisKey.PLATFORM_DATA.PLATFORM_CATCHRATE) || 1;
    }

    //读取场景捕获率
    getSceneCatchRate(sceneId){
        return this._cache.get(redisKey.PLATFORM_DATA.SCENE_CATCHRATE + sceneId) || 1;
    }

    // /全服提现修正
    get catchRevise () {
        return this._cache.get(redisKey.PLATFORM_DATA.PLATFORM_CATCH_REVISE);
    }
}

module.exports = CacheReader;