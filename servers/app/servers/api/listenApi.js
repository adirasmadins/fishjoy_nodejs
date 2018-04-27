const httpHandler = require('../common/httpHandler');
const genAccount = require('../common/genAccount');

module.exports = function (router, apiCfgs, PREFIX) {

    router.prefix(PREFIX);
    for (let key in apiCfgs) {
        let apiCfg = apiCfgs[key];
        router.post(apiCfg.route, async (ctx, next) => {
            if (apiCfg.ext) {
                for (let i in apiCfg.ext) {
                    if (typeof apiCfg.ext[i] === 'function') {
                        apiCfg.ext[i](ctx);
                    }
                }
            }
            await httpHandler(ctx, apiCfg.handler, next);
        });
        genAccount.registeApiCfg(PREFIX + apiCfg.route, apiCfg);
    }

};