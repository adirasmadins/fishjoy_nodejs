const ReqHandler = require('../../common/reqHandler');
const matchingCmd = require('../../../cmd/matchingCmd');
const omelo = require('omelo');

class MatchingHandler extends ReqHandler {
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
    let req = matchingCmd.request;
    for (let k of Object.keys(req)) {
        MatchingHandler.registe(req[k].route.split('.')[2]);
    }
    return new MatchingHandler();
};