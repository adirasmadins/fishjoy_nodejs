const listenApi = require('../../api/listenApi');
const {apiCfgs, PREFIX} = require('../../api/pay/payClientApiConfig');

module.exports = (router) => {
    listenApi(router, 'pay', 'payClientApiConfig', apiCfgs, PREFIX);
};