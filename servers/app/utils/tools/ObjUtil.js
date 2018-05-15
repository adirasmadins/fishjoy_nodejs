const crypto = require('crypto');
const ERROR_OBJ = require('../../consts/fish_error').ERROR_OBJ;
const PAGE_CFGs = require('../../servers/admin/configs/page');

exports.isUndefined = isUndefined;
exports.pages = pages;
exports.encodePwd = encodePwd;
exports.createSalt = createSalt;
exports.generateSessionToken = generateSessionToken;
exports.makeSqlDataFromTo = makeSqlDataFromTo;
exports.unique = unique;
exports.clone = clone;

exports.getQueryTable = getQueryTable;
exports.getQueryTableParams = getQueryTableParams;

exports.makeDeepObj = makeDeepObj;

/**
 * 制作深度对象，如果没有属性则创建属性，直到最终节点
 * @param {*} obj 
 * @param {*} paramList 
 * @param {*} defaultValue 
 */
function makeDeepObj(obj, paramList, defaultValue) {
    if (paramList.length > 0) {
        let attr = paramList.shift();
        if (!obj[attr]) {
            obj[attr] = {};
            if (paramList.length == 0) {
                obj[attr] = defaultValue;
            }
        }
        return makeDeepObj(obj[attr], paramList, defaultValue);
    }
}

/**
 * 克隆一个对象.
 * @param {*} obj 
 */
function clone(obj) {
    var buf;
    if (obj instanceof Array) {
        buf = [];  //创建一个空的数组
        var i = obj.length;
        while (i > 0 && i--) {
            buf[i] = clone(obj[i]);
        }
        return buf;
    } else if (obj instanceof Object) {
        buf = {};  //创建一个空对象
        for (var k in obj) {  //为这个对象添加新的属性
            buf[k] = clone(obj[k]);
        }
        return buf;
    }
    return obj;
}

/**
 * 获取查询表参数.
 * @param {*} queryTableList [ 'tbl_xxx_20180101', 'tbl_xxx_20180102', 'tbl_xxx_20180103', 'tbl_xxx_20180104' ]
 * @param {*} countList [ 0, 8, 81, 18 ]
 * @param {*} start 500
 * @param {*} end 500 + 500 = 1000
 * @param {*} length 500
 */
function getQueryTableParams(queryTableList, countList, start, end, length) {
    let maxIdx = 0;//当前检验过的结果行数
    let minIdx = 0;//使用过的结果行数
    let queryTable = [];
    for (let i = 0; i < countList.length; i++) {
        let count = countList[i];
        maxIdx += count;
        if (start < maxIdx) {
            let param = { tableName: queryTableList[i] };
            if (start >= minIdx && start <= maxIdx) {
                param.start = start - minIdx;
                param.length = Math.min(length, maxIdx - start);
            }
            else if (start <= minIdx && end >= maxIdx) {
                param.start = 0;
                param.length = count;
            }
            else if (end >= minIdx && end <= maxIdx) {
                param.start = 0;
                param.length = end - minIdx;
            }
            queryTable.push(param);
        }
        if (end < maxIdx) {
            break;
        }
        minIdx = maxIdx;
    }
    console.log('queryTable:', queryTable);

    return queryTable;
}

/**
 * 获取查询表参数.
 * @param {*} dateList [ '20180101', '20180102', '20180103', '20180104' ]
 * @param {*} countList [ 0, 8, 81, 18 ]
 * @param {*} start 500
 * @param {*} end 500 + 500 = 1000
 * @param {*} length 500
 */
function getQueryTable(dateList, countList, start, end, length) {
    let maxIdx = 0;//当前检验过的结果行数
    let minIdx = 0;//使用过的结果行数
    let queryTable = [];
    for (let i = 0; i < countList.length; i++) {
        let count = countList[i];
        maxIdx += count;
        if (start < maxIdx) {
            let param = { tableName: dateList[i] };
            if (start >= minIdx && start <= maxIdx) {
                param.start = start - minIdx;
                param.length = Math.min(length, maxIdx - start);
            }
            else if (start <= minIdx && end >= maxIdx) {
                param.start = 0;
                param.length = count;
            }
            else if (end >= minIdx && end <= maxIdx) {
                param.start = 0;
                param.length = end - minIdx;
            }
            queryTable.push(param);
        }
        if (end < maxIdx) {
            break;
        }
        minIdx = maxIdx;
    }
    console.log('queryTable:', queryTable);

    return queryTable;
}


/**
 * 数组去重
 * @param {Array} array 
 */
function unique(array) {
    var n = [];
    for (var i = 0; i < array.length; i++) {
        if (n.indexOf(array[i]) == -1) n.push(array[i]);
    }
    return n;
}

function makeSqlDataFromTo(startDate, endDate) {
    let from = startDate + ' 00:00:00';
    let to = endDate + ' 23:59:59';
    return [from, to];
}

function isUndefined(data, fields) {
    logger.info('params:', fields);
    logger.info('data:', data);
    for (let i = 0; i < fields.length; i++) {
        if (undefined == data[fields[i]]) {
            logger.error('undefined param:', data[fields[i]]);
            return true;
        }
    }
    return false;
}

function pages(setRoute) {
    for (let page in PAGE_CFGs) {
        let route = PAGE_CFGs[page].route;
        let ejs = PAGE_CFGs[page].ejs;

        setRoute(route, ejs);
    }
}

function encodePwd(salt, pwd) {
    let sha = crypto.createHash('sha512');
    sha.update(salt);
    sha.update(pwd);

    let hv = sha.digest();
    let i;
    for (i = 0; i < 512; i++) {
        sha = crypto.createHash('sha512');
        sha.update(hv);
        hv = sha.digest();
    }

    return hv.toString('base64');
}

function createSalt() {
    return crypto.randomBytes(24).toString('hex');
}

function generateSessionToken(userId) {
    return userId + '_' + crypto.randomBytes(24).toString('hex');
}

exports.max = max;

/**
 * 取对象的最大值时的对象
 * @param {Object} obj 
 */
function max(obj) {
    let ret = {};
    let maxValue = 0;
    let init = true;
    for (let i in obj) {
        if (init) {
            maxValue = Number(obj[i]);
            ret = {
                key: i,
                value: maxValue
            };
            init = false;
        }
        if (Number(obj[i]) > maxValue) {
            maxValue = Number(obj[i]);
            ret = {
                key: i,
                value: maxValue
            };
        }
    }
    return ret;
}

exports.avg = avg;

/**
 * 取对象的平均值
 * @param {Object} obj 
 */
function avg(obj) {
    let ret = 0;
    let sum = 0;
    let count = 0;
    for (let i in obj) {
        count++;
        sum += +obj[i];
    }
    if (count > 0) {
        ret = sum / count;
    }
    return ret;
}