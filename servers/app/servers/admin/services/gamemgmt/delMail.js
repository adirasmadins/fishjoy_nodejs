const SQL_CONFIG = require('../../configs/sql');
const tools = require('../../../../utils/tools');

/**
 * 执行删除邮件的命令
 * @param {*} data {id:123} 
 */
exports.get = async function (data, ctx) {
    console.log('data:', data);
    let mailId  = Number(data.id);

    try {
        await tools.SqlUtil.query(SQL_CONFIG.delMail, [mailId]);
        return {
            result: true
        };
    }
    catch(err) {
        logger.error('err:', err);
        return {
            result: false
        };
    }

};

