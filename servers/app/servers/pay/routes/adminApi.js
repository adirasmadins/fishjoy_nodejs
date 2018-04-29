const listenApi = require('../../api/listenApi');
const {apiCfgs, PREFIX} = require('../../api/pay/adminApiConfig');

module.exports = (router) => {
    listenApi(router, 'pay', 'adminApiConfig', apiCfgs, PREFIX);
};