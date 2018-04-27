const DateUtil = require('../utils/DateUtil');

exports.initMonthSign = initMonthSign;

/**
 *初始化月签数据
 */
function initMonthSign() {
    let ret = "";
    let n = DateUtil.getDaysOfThisMonth();
    for (let i = 0; i < n; i++) {
        if (i > 0) ret += ",";
        ret += "0";
    }
    return ret;
}