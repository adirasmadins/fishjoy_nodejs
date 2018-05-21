const ReqHandler = require('../../common/reqHandler');
const fishCmd = require('../../../cmd/fishCmd');
const arenaCmd = require('../../../cmd/arenaCmd');

class FishHandler extends ReqHandler{
    constructor(){
        super();
    }
}

module.exports = function () {
    let req = fishCmd.request;
    for(let k of Object.keys(req)){
        FishHandler.registe(req[k].route.split('.')[2]);
    }

    req = arenaCmd.request;
    for(let k of Object.keys(req)){
        FishHandler.registe(req[k].route.split('.')[2]);
    }

    return new FishHandler();
};


