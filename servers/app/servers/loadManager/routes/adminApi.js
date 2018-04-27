const serverLoad = require('../controllers/serverLoad');
const httpHandler = require('../../common/httpHandler');

module.exports = (router) => {
    router.prefix('/loadManager/adminApi');

    router.get('/gameLoad', async (ctx, next) => {
        await httpHandler(ctx, serverLoad.getGameLoad, next);
    });

    router.get('/rankMatchLoad', async (ctx, next) => {
        await httpHandler(ctx, serverLoad.rankMatchLoad, next);
    });
};