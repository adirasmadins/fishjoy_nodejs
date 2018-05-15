exports.sum = sum;
exports.isArray = isArray;
exports.contain = contain;

/**
 * 给定开始和结束的日期(yyyy-MM-dd)， 获取这段时间跨过的所有日期列表
 */
function sum(array) {
    let ret = 0;

    for (let i = 0; i < array.length; i++) {
        ret += +array[i];
    }

    return ret;
}

/**
 * 判断一个对象是否为一个数组.
 * @param {*} obj 
 */
function isArray(obj) {
    if (!obj) {
        return false;
    }
    if (typeof obj == "object" && obj.constructor == Array) {
        return true;
    }
    return false;
}

/**
 * 数组arr中是否存在元素target
 * @param {*} arr 
 * @param {*} target 
 */
function contain(arr, target) {
    return arr.indexOf(target) != -1;
}