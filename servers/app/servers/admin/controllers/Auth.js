const tools = require('../../../utils/tools');
const ask = require('../../common/logicResponse').ask;
const handler = require('../services/auth/handler');

class Auth {
    async login(data, ctx) {
        logger.error('ctx:', ctx);
        tools.BuzzUtil.checkFields(data, 'login');
        let ret = await handler.login.get(data, ctx);
        return ask(ret);
    }
}

module.exports = new Auth();