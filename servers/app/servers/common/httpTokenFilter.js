const ERROR_OBJ = require('../../consts/fish_error').ERROR_OBJ;
const answer = require('../../utils/answer');
const checkToken = require('./checkToken');

class HttpTokenFilter {
    constructor() {
        this._ignoreRouteMap = new Set();
    }

    async before(ctx, next) {
        try {
            let ignore = false;
            for (let route of this._ignoreRouteMap) {
                if (ctx.url.search(route) >= 0) {
                    ignore = true;
                    break;
                }
            }

            if (ignore == false && !!ctx.request.body && !!ctx.request.body.data && !!ctx.request.body.data.token && ctx.request.body.data.token !== undefined) {
                let token = ctx.request.body.data.token;
                if (token) {
                    let strs = token.split('_');
                    if (strs.length >= 2) {
                        let uid = Number.parseInt(strs[0]);
                        if (!Number.isNaN(uid)) {
                            await checkToken(uid, token);
                            ignore = true;
                            ctx.request.body.data.uid = uid;
                        }
                    }
                }
            }

            if (ignore) {
                await next();
            } else {
                throw ERROR_OBJ.TOKEN_INVALID;
            }

        } catch (err) {
            logger.info(ctx.url, '会话TOKEN无效，请重新登录', err);
            ctx.body = answer.httpResponse(err, ctx.request.body.aes, true);
        }
    }

    async after(ctx, next) {
        await next();
    }

    addIgnoreRoute(route) {
        this._ignoreRouteMap.add(route);
    }
}

module.exports = new HttpTokenFilter();