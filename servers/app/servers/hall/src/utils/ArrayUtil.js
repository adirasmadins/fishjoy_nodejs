////////////////////////////////////////
// ArrayUtil
// 数组处理工具集
//--------------------------------------
// 如何使用
// var ArrayUtil = require('src/utils/ArrayUtil');
// ArrayUtil.func(arr, params...);
////////////////////////////////////////

var StringUtil = require('../utils/StringUtil');

//==============================================================================
// public
//==============================================================================

//------------------------------------------------------------------------------
// definition
//------------------------------------------------------------------------------
exports.addOnly = addOnly;
exports.contain = contain;
exports.inArray = inArray;
exports.isArray = isArray;
exports.getItem = getItem;
exports.sum = sum;
exports.makeArrayString = makeArrayString;
exports.getIntArr = getIntArr;
exports.removeByValue = removeByValue;
exports.delRepeat = delRepeat;

exports.sort = sort;

const SORT_RULE = {
    DESC: 'desc',
    INC: 'inc',
};
exports.SORT_RULE = SORT_RULE;

/**
 * 数组按两个条件来排序
 */
function sort(arr, key1, rule1, key2, rule2) {
    arr.sort(function(a, b){
        if (a[key1] === b[key1]) {
            switch(rule2) {
                case SORT_RULE.DESC:
                return b[key2] - a[key2];
                case SORT_RULE.INC:
                return a[key2] - b[key2];
            }
        } else {
            switch(rule1) {
                case SORT_RULE.DESC:
                return b[key1] - a[key1];
                case SORT_RULE.INC:
                return a[key1] - b[key1];
            }
        }
    });
}

//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------
function addOnly(arr, add_item) {
    if (arr.indexOf(add_item) == -1) {
        arr.push(add_item);
    }
}

function contain(arr, target) {
    return arr.indexOf(target) != -1;
}

function inArray(arr, target, field) {
    for (var i = 0; i < arr.length; i++) {
        var item = arr[i];
        if (item[field] == target) {
            return true;
        }
    }
    return false;
}

function getItem(arr, target, field) {
    for (var i = 0; i < arr.length; i++) {
        var item = arr[i];
        if (item[field] == target) {
            return item;
        }
    }
    return null;
}

function isArray(obj) {
    if (!obj) {
        return false;
    }
    if (typeof obj == "object" && obj.constructor == Array) {
        return true;
    }
    return false;
}

function sum(arr) {
    var ret = 0;
    for (var i = 0; i < arr.length; i++) {
        if (arr[i]) {
            ret += arr[i];
        }
    }
    return ret;
}

function makeArrayString(str) {
    var ret = str;
    if (StringUtil.isString(str)) {
        if (!StringUtil.startsWith(str, "[") 
            && !StringUtil.endsWith(str, "]")) {
            ret = "[" + str + "]";
        }
    }
    return ret;
}

/**
 * 从一个数组样式的字符串获取一个数字数组
 */
function getIntArr(str) {
    if (str == null) {
        return [];
    }
    if (isArray(str)) {
        return str;
    }
    var strArr = str.split(",");
    var intArr = [];
    strArr.forEach(function(data,index,arr) {
        intArr.push(+data);
    });
    return intArr;
}

/**
 * 从一个数据中删除一个元素
 * @param arr
 * @param val
 */
function removeByValue(arr, val) {
    for(var i=0; i<arr.length; i++) {
        if(arr[i] == val) {
            arr.splice(i, 1);
            break;
        }
    }
}

/**
 * 数组去重.
 */
function delRepeat(arr) {
    var res = [];
    var json = {};
    for(var i = 0; i < arr.length; i++){
        if(!json[arr[i]]) {
            res.push(arr[i]);
            json[arr[i]] = 1;
        }
    }
    return res;
}