const session = require('../../../config/session');
const CryptoJS = require("crypto-js");
const ERROR_OBJ = require('../../consts/fish_error').ERROR_OBJ;
const answer = require('../../utils/answer');

class HttpAesFilter {
    constructor() { }

    async before(ctx, next) {
        let body = ctx.request.body;
        if (body && body.data) {
            let data = body.data;
            if (!!body.aes && body.aes == 'true') {
                let bytes = CryptoJS.AES.decrypt(decodeURIComponent(data), session.secret);
                data = bytes.toString(CryptoJS.enc.Utf8);
            }

            try {
                if (typeof data == 'string') {
                    body.data = JSON.parse(data);
                }

            } catch (e) {
                ctx.body = answer.httpResponse(ERROR_OBJ.PARAM_MISSING, body.aes, true);
                logger.error(ctx.request.method, e);
                return;
            }
        }
        await next();
    }

    async after(ctx, next) {
        await next();
    }
}

module.exports = new HttpAesFilter();