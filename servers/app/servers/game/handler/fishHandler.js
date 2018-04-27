const ReqHandler = require('../../common/reqHandler');
const fishCmd = require('../../../cmd/fishCmd');
const gameApp = require('../gameApp');

class FishHandler extends ReqHandler{
    constructor(){
        super();
    }

    request(route, msg, session, next) {
        gameApp.request(route, msg, session, (err, result)=>{
            super.response(err, result, next);
        });
    }
}

module.exports = function () {
    let req = fishCmd.request;
    for(let k of Object.keys(req)){
        FishHandler.registe(req[k].route.split('.')[2]);
    }
    return new FishHandler();
};


