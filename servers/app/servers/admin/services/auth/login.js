const askEjs = require('../../../common/logicResponse').askEjs;
const tools = require('../../../../utils/tools');

const ROLE_CONFIG = require('../../configs/role');
const SQL_CONFIG = require('../../configs/sql');

/**
 * 登录接口
 * @param {*} data {username:'username',password:'password'} 
 */
exports.get = async function (data, ctx) {
    logger.error('data:', data);
    try {
        let result = await tools.SqlUtil.query(SQL_CONFIG.getAccountByUname, [data.username]);
        let account = result[0];
        let encodePwd = tools.ObjUtil.encodePwd(account.salt, data.password);
        if (encodePwd == account.password) {
            if (!account.valid) {
                throw new Error('用户已经被禁止登录');
            }
            let role = ROLE_CONFIG[account.role];
            logger.error('role:', role);
            ctx.session.role = role;
            ctx.session.i18n = data.i18n || 'en_US';
            ctx.session.uname = data.username;
            ctx.session.uid = account.id;
            logger.error('ctx.session.role:', ctx.session.role);
            return {
                result: true
            };
        } else {
            throw new Error('用户名和密码不匹配');
        }
    }
    catch(err) {
        logger.error('err:', err);
        return {
            result: false,
            data: data,
            err: err.toString(),
        };
    }
};
