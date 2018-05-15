const SQL_CONFIG = require('../../configs/sql');
const tools = require('../../../../utils/tools');

/**
 * 获取留存数据接口需要的返回值
 * @param {*} data { username: 'vip_guest', auth: 'true'|'false' }
 */
exports.get = async function (data, ctx) {
    console.log('data:', data);
    try {
        let auth = data.auth == 'true';
        await switchAuth(data.username, auth);

        return {
            result:true
        };
    } catch (err) {
        return {
            result:false,
            err: err
        };
    }
};

async function switchAuth(uname, auth) {
    await tools.SqlUtil.query(SQL_CONFIG.switchValid, [auth, uname]);
}