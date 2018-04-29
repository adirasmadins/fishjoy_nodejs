const listenApi = require('../../api/listenApi');
const {apiCfgs,PREFIX} = require('../../api/gate/gateClientApiConfig');

module.exports = (router) => {
    listenApi(router, 'gate', 'gateClientApiConfig', apiCfgs, PREFIX);
};