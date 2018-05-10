const ReqHandler = require('../../common/reqHandler');
const gateCmd = require('../../../cmd/gateCmd');
const omelo = require('omelo');

class GateHandler extends ReqHandler{
    constructor() {
        super();
    }

    request(route, msg, session, next) {
        omelo.app.entry.request(route, msg, session, (err, result)=>{
            super.response(err, result, next);
        });
    }
}

module.exports = function () {
    let req = gateCmd.request;
    for(let k of Object.keys(req)){
        GateHandler.registe(req[k].route.split('.')[2]);
    }
    return  new GateHandler();
};