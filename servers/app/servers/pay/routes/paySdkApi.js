const data_pay = require('../controllers/data/pay');

const PREFIX = '/pay/sdkApi';

module.exports = (router) => {
    router.prefix(PREFIX);

    router.get('/payCallback', async (ctx, next) => {
        let data = ctx.query;
        ctx.body = await data_pay.callback(data);
        await next();
    });

    router.post('/payCallback', async (ctx, next) => {
        let data = ctx.request.body.fields;
        logger.info("body:",ctx.request.body);
        ctx.body = await data_pay.callback(data);
        await next();
    });
};