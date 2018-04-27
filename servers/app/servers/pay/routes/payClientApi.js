const listenApi = require('../../api/listenApi');
const {apiCfgs, PREFIX} = require('../../api/pay/payClientApiConfig');

module.exports = (router) => {
    listenApi(router, apiCfgs, PREFIX);
};