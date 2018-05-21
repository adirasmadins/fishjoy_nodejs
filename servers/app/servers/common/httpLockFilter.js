const ERROR_OBJ = require('../../consts/fish_error').ERROR_OBJ;
const answer = require('../../utils/answer');
const INCR_LOCK_UID = 'incr:lock:';

const MATCH_MODE = {
    FULL: 0,
    PART: 1
};
class HttpLockFilter {
    constructor() {
        this._lockRoutes = new Map();
        this._matchMode = MATCH_MODE;

    }

    get matchMode() {
        return this._matchMode;
    }

    async lock(url, uid) {
        let key = this.lockKey(uid);
        logger.info("lock:", url);
        let curVal = await redisConnector.incrP(key);
        await redisConnector.expireP(key, 2);
        return curVal == 1;
    }

    unlock(uid) {
        logger.info("unlock=========================================:");
        let key = this.lockKey(uid);
        redisConnector.cmd.del(key);
    }

    async before(ctx, next) {
        let islock = false;
        for (let [route, mode] of this._lockRoutes.entries()) {
            if(ctx.url.search(route)!=-1) {
                if (mode == this.matchMode.FULL) {
                    islock = ctx.url === route;
                }else {
                    islock = true;
                }
                break;
            }
        }

        if (!islock) {
            return await next();
        }

        try {
            let uid = ctx.request.body && ctx.request.body.data && ctx.request.body.data.uid;
            if (uid && !await this.lock(ctx.url, uid)) {
                logger.info(`${uid} API调用过于频繁`);
                throw ERROR_OBJ.CALL_TOO_OFTEN;
            }
        } catch (err) {
            ctx.body = answer.httpResponse(err, ctx.request.body.aes, true);
            logger.error(ctx.request.method, err);
            return;
        }
        logger.info('call next');

        await next();
    }

    async after(ctx, next) {
        let uid = ctx.request.body && ctx.request.body.data &&  ctx.request.body.data.uid;
        uid && this.unlock(uid);
        await next();
    }

    addRoute(route, type = MATCH_MODE.FULL) {
        this._lockRoutes.set(route, type);
    }

    lockKey(uid) {
        return `${INCR_LOCK_UID}${uid}`;
    }

}

module.exports = new HttpLockFilter();