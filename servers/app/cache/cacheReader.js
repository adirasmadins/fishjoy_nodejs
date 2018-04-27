const cache = require('./cache');
const redisKey = require('../database').dbConsts.REDISKEY;

class CacheReader{
    constructor(){
       this._data = new Map();
    }

    //读取平台抽水系数
    get pumpwater(){
        return cache.get(redisKey.PLATFORM_DATA.PUMPWATER);
    }

    //读取平台捕获率
    get platformCatchRate(){
        return cache.get(redisKey.PLATFORM_DATA.PLATFORM_CATCHRATE) || 1;
    }

    //读取场景捕获率
    getSceneCatchRate(sceneId){
        return cache.get(redisKey.PLATFORM_DATA.SCENE_CATCHRATE + sceneId) || 1;
    }

    // /全服提现修正
    get catchRevise () {
        return cache.get(redisKey.PLATFORM_DATA.PLATFORM_CATCH_REVISE);
    }

    


}

module.exports = new CacheReader();