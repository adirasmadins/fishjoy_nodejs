const httpHandler = require('../common/httpHandler');
const genAccount = require('../common/genAccount');
const versionsUtil = require('../../utils/imports').versionsUtil;
const VER = versionsUtil.getVerKey();

function loadApi(list, dir, tag) {
    try {
        const ver_api_list = require(`./${dir}/${tag}.${VER}`);
        for(let key in ver_api_list){
            list[key] = ver_api_list[key];
        }
    } catch (err) {
        err;
    }
}

module.exports = function (router, dir, tag, apiCfgs, PREFIX) {
    loadApi(apiCfgs, dir, tag);

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