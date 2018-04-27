/**
 * 过滤未登陆用户请求
 */
const answer = require('../../utils/answer');

class UnLoginFilter {
    constructor() {}

    before(msg, session, next) {

        if (msg.__route__.search(/^game\.fishHandler\.c_login$/i) == -1) {
            if (!session.uid) {
                next(CONSTS.SYS_CODE.PLAYER_NOT_LOGIN, answer.respData(CONSTS.SYS_CODE.PLAYER_NOT_LOGIN));
                return;
            }
        }
        next();
    }

}

module.exports = new UnLoginFilter();