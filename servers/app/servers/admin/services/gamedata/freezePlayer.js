// 冻结玩家(拉黑)
const blackList = require('../../../../common/security/BlackList');

/**
 * 获取充值排名接口需要的返回值
 * @param {*} data {uid:'1,2,3', op:'freeze'|'unfreeze', reason}
 */
exports.get = async function (data, ctx) {
    // logger.error('data:', data);
    try {
        let op = data.op;
        let uidList = data.uid.split(',');

        if ('unfreeze' == op) {
            await blackList.remove(uidList);
        }
        if ('freeze' == op) {
            await blackList.add(uidList, -10);
        }

        return {
            result: true
        };
    }
    catch (err) {
        logger.error(err);
        return {
            err: err,
            result: false
        };
    }
};