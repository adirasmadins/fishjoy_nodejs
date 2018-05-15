const freezeReason = require('../../configs/freezeReason').freezeReason;

/**
 * 获取充值排名接口需要的返回值
 * @param {*} data {}
 */
exports.get = async function (data, ctx) {
    return freezeReason;
};