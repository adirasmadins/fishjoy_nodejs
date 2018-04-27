const statistics = require('./statistics');

class ActiveStatisticsFilter {

    async before(ctx, next) {
        if (ctx.request.body.data && ctx.request.body.data.uid) {
            statistics.playerActive(ctx.request.body.data.uid);
            statistics.playerApiOperateLog(ctx.request.body.data.uid, ctx.url);
        }
        await next();
    }

    async after(ctx, next) {

        await next();
    }

}

module.exports = new ActiveStatisticsFilter();