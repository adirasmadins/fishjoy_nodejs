////////////////////////////////////////
// CacheMail
// 邮件相关数据缓存(有效期内的邮件都会缓存起来)
//--------------------------------------
// 如何使用
// var CacheMail = require('src/buzz/CacheMail');
// CacheMail.func();
////////////////////////////////////////

//==============================================================================
// import
//==============================================================================
var _ = require('underscore');
//var StringUtil = require('../../utils/StringUtil');
// var DaoMail = require('../../dao/dao_mail');


//==============================================================================
// constant
//==============================================================================
var ERROR = 1;
var DEBUG = 0;


//==============================================================================
// global variable
//==============================================================================
// 使用说明: 有效期内的邮件都会缓存起来
var gMailCache = {};


//==============================================================================
// public
//==============================================================================

//------------------------------------------------------------------------------
// definition
//------------------------------------------------------------------------------
// 缓存邮件内容相关
exports.push = push;
exports.cache = cache;
exports.length = length;
exports.contains = contains;
exports.getMailById = getMailById;


//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------

/**
 * 检测gMailCache长度, 超过11000条数据时将前面的10000条写入数据库中
 */
function push(data) {
    var id = data.id;// 邮件ID
    gMailCache["" + id] = data;
}

/**
 * 将gMailCache全部写入数据库中
 */
function cache() {
    return gMailCache;
}

/**
 * 获得当前gMailCache的长度
 */
function length() {
    return _.keys(gMailCache).length;
}

/**
 * 根据邮件ID获取一封邮件的全部内容
 */
function getMailById(id) {
    return gMailCache["" + id];
}

/**
 * 检测缓存中是否存在查询ID指向的邮件.
 */
function contains(id) {
    return gMailCache["" + id] != null;
}

