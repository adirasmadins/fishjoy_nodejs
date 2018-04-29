const admin_operation = require('../../pay/controllers/data/admin_operation');

const api_list = {
    buy_card: {
        route: '/buy_card', //后台批准提现
        handler: admin_operation.buyCard,
        params: [],
        accountFields: []
    }
};

module.exports = {
    apiCfgs: api_list,
    PREFIX: '/pay/adminApi',
};