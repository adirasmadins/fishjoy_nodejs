const versions = require('./versions');

class VersionsUtil{
    constructor(){
        this._divisionPlatform = false;
        this._imgDispatcher = false;
        this._init();
    }

    _init(){
        if(versions.PLATFORM_DIVISION.indexOf(versions.PUB) != -1){
            this._divisionPlatform = true;
        }

        if(versions.IMG_DISPATCHER.indexOf(versions.PUB) != -1){
            this._imgDispatcher = true;
        }
    }

    getVerKey () {
        return versions.VER_KEY[versions.PUB];
    }

    getOpenid(openid, device){
        if(this._divisionPlatform){
            return `${openid}_${device}`;
        }else{
            return openid;
        }
    }

    getCDNDomain(){
        return versions.CDN_DOMAIN[versions.PUB];
    }

    getImgDispatcher(){
        return this._imgDispatcher;
    }

    getWWWDomain(){
        return versions.WWW_DOMAIN.indexOf(versions.PUB) !== -1 ? 'www.' : null;
    }

    isDevelopment(){
        return versions.DEVELOPMENT;
    }
}

module.exports = new VersionsUtil();