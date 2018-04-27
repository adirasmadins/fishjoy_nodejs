const _ = require('underscore');
const ERROR_OBJ = require('../../consts/fish_error').ERROR_OBJ;

class HttpSessionFilter {
    constructor() {
        this._ignoreRouteMap = new Set();
    }

    async before(ctx, next) {
        try {
            let ignore = false;
            for (let route of this._ignoreRouteMap) {
                if (ctx.url.search(route) >= 0 || ctx.url == '/') {
                    ignore = true;
                    break;
                }
            }
            if (!ignore && 0 == _.keys(ctx.session).length) {
                throw ERROR_OBJ.SESSION_EXPIRED;
            }
        }
        catch (err) {
            this.handleError(ctx, err);
            return;
        }
        await next();

    }

    handleError(ctx, err) {
        logger.error(ctx.url, '会话SESSION无效，请重新登录', err);
        ctx.body = answer.httpResponse(err, ctx.request.body.aes, true);
    }

    async after(ctx, next) {
        await next();
    }

    addIgnoreRoute(route) {
        this._ignoreRouteMap.add(route);
    }
}

module.exports = new HttpSessionFilter();
module.exports.HttpSessionFilter = HttpSessionFilter;