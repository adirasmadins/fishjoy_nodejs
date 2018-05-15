const moment = require('moment');
const SQL_CONFIG = require('../../configs/sql');
const tools = require('../../../../utils/tools');

/**
 * 获取留存数据接口需要的返回值
 * @param {*} data { username: 'vip_guest', password: '123456' }
 */
exports.get = async function (data, ctx) {
    // logger.info('data:', data);
    try {
        await modifyOpPwd(data.username, data.password);

        return {
            result:true
        };
    } catch (err) {
        logger.error('err:', err);
        return {
            result:false,
            err: err
        };
    }
};

async function modifyOpPwd(uname, pwd) {
    let salt = tools.ObjUtil.createSalt();
    let encodePwd = tools.ObjUtil.encodePwd(salt, pwd);
    await tools.SqlUtil.query(SQL_CONFIG.modifyPwd, [salt, encodePwd, uname]);
}