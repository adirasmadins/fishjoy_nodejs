const versions = require('../../../utils/imports').versions;

class PlatformCtrl{
    constructor(){
        this._divisionPlatform = true;
        this._divisionVers = [versions.GAMEPLAY.WANBA];
        this._init();
    }

    _init(){
        if(this._divisionVers.indexOf(versions.PUB) == -1){
            this._divisionPlatform = false;
        }
    }

    getOpenid(openid, device){
        if(this._divisionPlatform){
            return `${openid}_${device}`;
        }else{
            return openid;
        }
    }
    
}

module.exports = new PlatformCtrl();