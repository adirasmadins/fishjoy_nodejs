const httpHandler = require('../../common/httpHandler');
const genAccount = require('../../common/genAccount');
const chatClientApiConfig = require('../api/chatClientApiConfig');

const PREFIX = '/chat/clientApi';

module.exports = (router) => {
    router.prefix(PREFIX);

    for (let i = 0; i < chatClientApiConfig.length; i++) {
        let apiCfg = chatClientApiConfig[i];
        router.post(apiCfg.route, async (ctx, next) => {
            await httpHandler(ctx, apiCfg.handler, next);
        });
        genAccount.registeApiCfg(PREFIX + apiCfg.route, apiCfg);
    }
};