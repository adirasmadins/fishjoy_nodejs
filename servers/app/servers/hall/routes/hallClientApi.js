const listenApi = require('../../api/listenApi');
const {apiCfgs,PREFIX} = require('../../api/hall/hallClientApiConfig');

module.exports = (router) => {
    listenApi(router, 'hall', 'hallClientApiConfig', apiCfgs, PREFIX);
};