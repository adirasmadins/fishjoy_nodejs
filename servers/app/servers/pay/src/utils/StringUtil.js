////////////////////////////////////////
// StringUtil
// 字符串处理工具集
//--------------------------------------
// 如何使用
// var StringUtil = require('src/utils/StringUtil');
// StringUtil.func(str, params...);
////////////////////////////////////////

//==============================================================================
// public
//==============================================================================

//------------------------------------------------------------------------------
// definition
//------------------------------------------------------------------------------
exports.startsWith = startsWith;
exports.endsWith = endsWith;
exports.subString = subString;
exports.strLen = strLen;
exports.trim = trim;
exports.split = split;
exports.replaceAll = replaceAll;
exports.contain = contain;
exports.isString = isString;
exports.indexOf = indexOf;
exports.repeatJoin = repeatJoin;

//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------
function indexOf(str, char) {
    return str.indexOf(char);
}

function startsWith(str, prefix) {
    return str.slice(0, prefix.length) === prefix;
}

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

function subString(str, start, stop) {
    return str.substring(start, stop);
}

function strLen(str) {
    var len = 0;
    for (var i = 0; i < str.length; i++) {
        if (str.charCodeAt(i) > 127 || str.charCodeAt(i) == 94) {
            len += 2;
        } else {
            len++;
        }
    }
    return len;
}

function split(str, seperator) {
    return str.split(seperator);
}

function replaceAll(str, s1, s2) {
    if (indexOf(str, s1) != -1) {
        str = str.replace(s1, s2);
        return replaceAll(str, s1, s2);
    }
    else {
        return str;
    }
}

function contain(str, suffix) {
    return str.indexOf(suffix) !== -1;
}

function isString(obj) {
    return Object.prototype.toString.call(obj) === "[object String]"; 
}

function trim(str, char) {
    if (startsWith(str, char)) {
        str = subString(str, 1, strLen(str));
        return trim(str, char);
    }
    if (endsWith(str, char)) {
        str = subString(str, 0, strLen(str) - 1);
        return trim(str, char);
    }
    return str;
}

function repeatJoin(str, seperator, count) {
    var ret = "";
    for (var i = 0; i < count; i++) {
        if (i != 0) {
            ret += seperator;
        }
        ret += str;
    }
    return ret;
}