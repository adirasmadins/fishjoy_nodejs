const checkToken = require('./checkToken');
const ERROR_OBJ = require('../../consts/fish_error').ERROR_OBJ;
const answer = require('../../utils/answer');
class TokenFilter {
    constructor() {
    }

    async before(msg, session, next) {
        if (msg.__route__.search(/^game\.fishHandler\.c_login$/i) != -1 ||
            msg.__route__.search(/^gate\.gateHandler\.c_query_entry/i) != -1) {
            let token = msg.token;
            let err = null;
            while(true){
                if (token) {
                    let strs = token.split('_');
                    if (strs.length != 2) {
                        err = ERROR_OBJ.TOKEN_INVALID;
                        break;
                    }
                    let uid = Number.parseInt(strs[0]);
                    if (Number.isNaN(uid)) {
                        err = ERROR_OBJ.UID_INVALID;
                        break;
                    }
                    try {
                        await checkToken(uid, token);
                        msg.uid = uid;
                    } catch (_err) {
                        err = _err;
                    }
                } else {
                    err = ERROR_OBJ.PARAM_MISSING;
                }
                break;
            }

            if(err){
                return next(err, answer.respNoData(err));
            }
        }
        next();
    }

}

module.exports = new TokenFilter();