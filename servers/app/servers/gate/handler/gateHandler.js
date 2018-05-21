const ReqHandler = require('../../common/reqHandler');
const gateCmd = require('../../../cmd/gateCmd');
const omelo = require('omelo');

class GateHandler extends ReqHandler{
    constructor() {
        super();
    }
}

module.exports = function () {
    let req = gateCmd.request;
    for(let k of Object.keys(req)){
        GateHandler.registe(req[k].route.split('.')[2]);
    }
    return  new GateHandler();
};