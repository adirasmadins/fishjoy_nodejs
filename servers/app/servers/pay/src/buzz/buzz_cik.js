var _ = require('underscore');
var CstError = require('../../../../consts/fish_error');
var BuzzUtil = require('../utils/BuzzUtil');

var ERROR_OBJ = CstError.ERROR_OBJ;
var dao_change = require('../dao/dao_change');

//------------------------------------------------------------------------------
// 缓存(Cache)
//------------------------------------------------------------------------------
var CacheOperation = require('./cache/CacheOperation');
var CacheChange = require('./cache/CacheChange');

//==============================================================================
// const
//==============================================================================
var DEBUG = 0;
var ERROR = 1;
var TAG = "【buzz_recieve】";


//==============================================================================
// public
//==============================================================================

//------------------------------------------------------------------------------
// definition
//------------------------------------------------------------------------------
exports.addCikOrder = addCikOrder;
exports.cikReduce = cikReduce;
exports.findValuesByCid = findValuesByCid;
exports.getCikLog = getCikLog;
exports.getCikInfo = getCikInfo;

//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------

function addCikOrder(dataObj, cb) {
    const FUNC = TAG + "addCikOrder() --- ";
    //----------------------------------
    _addCikOrder(dataObj, cb);
}

function cikReduce(dataObj, cb) {
    const FUNC = TAG + "cikReduce() --- ";
    //----------------------------------
    _cikReduce(dataObj, cb);
}

function findValuesByCid(dataObj, cb) {
    const FUNC = TAG + "findValuesByCid() --- ";
    //----------------------------------
    _findValuesByCid(dataObj, cb);
}

function getCikLog(dataObj, cb) {
    const FUNC = TAG + "getCikLog() --- ";
    _didGetCikLog(dataObj, cb);
}

function getCikInfo(dataObj, cb) {
    const FUNC = TAG + "getCikInfo() --- ";
    //----------------------------------
    _didGetCikInfo(dataObj, cb);
}


//==============================================================================
// private
//==============================================================================

/**
 * 插入一个订单
 */
function _addCikOrder(data, cb) {
    const FUNC = TAG + "_addCikOrder() --- ";
    var sn = CacheChange.makeSn();
    data.orderid = BuzzUtil.getOrderId(sn);
    data.sn = sn;
    CacheChange.push(data);

    cb(null, data);
    // // 写入数据库(由具体的API服务器来执行)
    // dao_change.insert(req.pool, data, function() {
    //     cb(null, data);
    // });
}

/**
 * 获取实物兑换记录
 */
function _cikReduce(dataObj, cb) {
    const FUNC = TAG + "_cikReduce() --- ";
    var cid = dataObj.cid;
    var value = dataObj.value;
    var count = CacheOperation.reduce(cid, 1, value);
    var total = CacheOperation.reduce(cid, 2, value);
    var ret = {
        count: count,
        total: total,
    };
    cb(null, ret);
}

/**
 * 获取实物兑换记录
 */
function _findValuesByCid(dataObj, cb) {
    const FUNC = TAG + "_findValuesByCid() --- ";
    var cid = dataObj.cid;
    var count = CacheOperation.findValueByCid(cid, 1);
    var total = CacheOperation.findValueByCid(cid, 2);
    var ret = {
        count: count,
        total: total,
    };
    cb(null, ret);
}

/**
 * 获取实物兑换记录
 */
function _didGetCikLog(dataObj, cb) {
    const FUNC = TAG + "_didGetCikLog() --- ";
    var uid = dataObj.uid;
    var ret = CacheChange.findChangeLogByUid(uid);
    cb(null, ret);
}

/**
 * 返回兑换数据中的每日剩余数量
 */
function _didGetCikInfo(dataObj, cb) {
    const FUNC = TAG + "_didGetCikInfo() --- ";
    // var uid = dataObj.uid;
    var ret = CacheOperation.getChangeDailyLeft();
    cb(null, ret);
}
