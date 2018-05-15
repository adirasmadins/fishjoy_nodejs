const SQL_CONFIG = require('../../configs/sql');
const tools = require('../../../../utils/tools');

/**
 * 获取留存数据接口需要的返回值
 * @param {*} data {startDate:'YYYY-MM-DD', endDate:'YYYY-MM-DD', start:1, length:100, uid:[1,2,3]} 
 */
exports.get = async function (data, ctx) {
    // console.log('data:', data);
    try {
        if (await checkUsername(data.username)) {
            await insertData(data.username, data.password);
            return {
                result:true
            };
        }
        else {
            throw new Error('用户名已经存在:' + data.username);
        }
    } catch (err) {
        return {
            result:false,
            err: err.toString()
        };
    }
};

/**
 * 检查管理人员用户名是否已经存在.
 */
async function checkUsername(uname) {
    // 添加唯一性约束到uname上
    // ALTER TABLE `tbl_admin_user` ADD UNIQUE ( `uname` )
    let ret = await tools.SqlUtil.query(SQL_CONFIG.checkOperator, [uname]);
    return ret.length == 0;
}

/**
 * 获取管理人员列表.
 */
async function insertData(uname, pwd) {
    // 生成salt, token等
    let salt = tools.ObjUtil.createSalt();
    let token = tools.ObjUtil.generateSessionToken(uname);
    let encodePwd = tools.ObjUtil.encodePwd(salt, pwd);
    return await tools.SqlUtil.query(SQL_CONFIG.addOperator, [uname, token, salt, encodePwd]);
}