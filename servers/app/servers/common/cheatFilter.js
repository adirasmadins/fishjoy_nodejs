const answer = require('../../utils/answer');
const tools = require('../../utils/tools');

class CheatFilter {
    constructor() {
    }

    async before(ctx, next) {
        // 阻挡操作，让玩家不能进入游戏
        try {
            let uid = ctx.request.body.data.uid;
            await tools.BuzzUtil.checkCheat(uid);
        } catch (err) {
            ctx.body = answer.httpResponse(err, ctx.request.body.aes, true);
            logger.error(ctx.request.method, err);
            return;
        }
        await next();
    }

    async after(ctx, next) {
        await next();
    }

}

module.exports = new CheatFilter();
