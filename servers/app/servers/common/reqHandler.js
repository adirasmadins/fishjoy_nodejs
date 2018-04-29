class ReqHandler {
    constructor() {}

    static registe(name) {
        let prototype = ReqHandler.prototype;
        prototype[name] = function (msg, session, next) {
            msg.uid = msg.uid || session.uid;
            this.request(name, msg, session, next);
        };
    }

    request(route, msg, session, next) {
        next(null, answer.respNoData(CONSTS.SYS_CODE.NOT_SUPPORT_SERVICE));
    }

    response(err, result, next) {
        if (err) {
            utils.invokeCallback(next, null, {error:err});
            return;
        }
        if (result) {
            utils.invokeCallback(next, null, result);
        } else {
            utils.invokeCallback(next, null, {error:CONSTS.SYS_CODE.OK});
        }
    }
}

module.exports = ReqHandler;