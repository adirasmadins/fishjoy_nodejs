const ArrayUtil = require('./ArrayUtil');

exports.makePercent = makePercent;
exports.getDenominator = getDenominator;
exports.min = min;
exports.max = max;

/**
 * 将输入的浮点数转换为百分比的字符串显示
 * makePercent(0.03247422537879205, 2) = 3.25%
 * @param {Number} input 输入的浮点数
 * @param {Number} fix 保留的小数点位数
 */
function makePercent(input, fix) {
    input *= 100;
    input = input.toFixed(fix);
    return input + '%';
}

/**
 * 获取合法的分母(不为0)
 * 如果输入为0, 返回1
 * @param {Number} input 
 */
function getDenominator(input) {
    return input == 0 ? 1 : input;
}

/**
 * 取数字数组的最小值
 * @param {Array} arr 
 */
function min(arr) {
    ret = arr[0];
    for (let i = 1; i < arr.length; i++) {
        ret = Math.min(ret, arr[i]);
    }
    return ret;
}

/**
 * 取对象的最大值(兼容数组)
 * @param {Object} obj 
 */
function max(obj) {
    let ret = 0;
    for (let i in obj) {
        ret = Math.max(ret, Number(obj[i]));
    }
    return ret;
}

/**
 * 获取概率索引
 * @param {*} probability [1000,2000,3000,4000] 
 */
exports.getRandomIdx = (probability) => {
    const totalProperty = ArrayUtil.sum(probability);
    const ran = Math.random() * totalProperty;
    let checkValue = 0;
    for (let i = 0; i < probability.length; i++) {
        checkValue += probability[i];
        if (ran < checkValue) {
            return i;
        }
    }
    return null;
};