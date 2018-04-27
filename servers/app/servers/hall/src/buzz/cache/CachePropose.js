////////////////////////////////////////
// CachePropose
// 建议相关数据缓存
//--------------------------------------
// 如何使用
// var CachePropose = require('src/buzz/cache/CachePropose');
// CachePropose.func();
////////////////////////////////////////

//==============================================================================
// import
//==============================================================================
var _ = require("underscore");
var ArrayUtil = require('../../utils/ArrayUtil');
// var DaoLink = require('../../dao/dao_link');

//------------------------------------------------------------------------------
// Cache
//------------------------------------------------------------------------------
var CacheUserInfo = require('./CacheUserInfo');

//------------------------------------------------------------------------------
// POJO
//------------------------------------------------------------------------------
var ObjPropose = require('../pojo/Propose');
var Propose = ObjPropose.Propose;


//==============================================================================
// constant
//==============================================================================
var ERROR = 1;
var DEBUG = 0;
var TAG = "【CachePropose】";


//==============================================================================
// global variable
//==============================================================================
// 使用说明: 定时存储记录, 存储时用队列方式
// 记录下当前长度len, 从队列中移除len个数据存入数据库, 等待下个周期
// 每一条记录格式如下
/**
propose = 
{
    uid: bigint,
    time: timestamp,
    text: string,
}
 */
var gProposeCache = [];


//==============================================================================
// public
//==============================================================================

//------------------------------------------------------------------------------
// definition
//------------------------------------------------------------------------------
exports.push = push;
exports.cache = cache;
exports.length = length;
exports.uids = uids;
exports.keys = keys;
exports.query = query;
exports.like = like;
exports.del = del;
exports.loadAll = loadAll;


//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------

/**
 * 检测gProposeCache长度, 超过11000条数据时将前面的10000条写入数据库中
 */
function push(data) {
    gProposeCache.push(data);
}

/**
 * 将gProposeCache全部写入数据库中
 */
function cache() {
    return gProposeCache;
}

/**
 * 将gProposeCache全部写入数据库中
 */
function length() {
    return gProposeCache.length;
}

/**
 * 返回缓存中所有的uid
 */
function uids() {
    var uid_list = [];
    for (var i = 0; i < gProposeCache.length; i++) {
        var propose = gProposeCache[i];
        if (!ArrayUtil.contain(uid_list, propose.uid)) {
            uid_list.push(propose.uid);
        }
    }
    return uid_list;
}

/**
 * 将gProposeCache全部写入数据库中
 */
function keys() {
    var id_collection = "";
    var list = [];
    for (var i = 0; i < gProposeCache.length; i++) {
        var propose = gProposeCache[i];
        if (propose.change) {
            if (id_collection.length > 0) id_collection += ",";
            id_collection += propose.mid;
            propose.change = false;
            list.push(propose);
        }
    }
    return {
        id_collection:id_collection,
        list:list,
    };
}

/**
 * 查询
 */
function query(request_uid, timestamp, count, need_hot4) {
    const FUNC = TAG + "query() --- ";

    var msg_list = [];
    for (var i = gProposeCache.length - 1; i >= 0; i--) {
        var propose = gProposeCache[i];
        if (propose.time < timestamp) {
            var ret_propose = ObjPropose.getPropose(request_uid,propose);
            msg_list.push(ret_propose);
        }
        if (msg_list.length >= count) {
            break;
        }
    }

    var hot4 = [];
    if (DEBUG) logger.info(FUNC + "need_hot4:", need_hot4);
    if (need_hot4) {
        var sortList = _.sortBy(gProposeCache, function(propose) {
            return propose.like_count;
        });
        sortList.sort(function(a, b){
            if (a.like_count == b.like_count) {
                return a.time - b.time;
            } else {
                return a.like_count - b.like_count;
            }
        });
        var count = 0;
        for (var i = sortList.length - 1; i >= 0; i--) {
            var propose = sortList[i];
            var ret_propose = ObjPropose.getPropose(request_uid, propose);
            hot4.push(ret_propose);
            count++;
            if (count >= 4) {
                break;
            }
        }
    }

    if (DEBUG) logger.info(FUNC + "msg_list:", msg_list);
    if (DEBUG) logger.info(FUNC + "hot4:", hot4);
    return {
        server_time: new Date().getTime(),
        msg_list: msg_list,
        hot4: hot4,
    };
}

/**
 * 点赞
 */
function like(uid, mid) {
    const FUNC = TAG + "like() --- ";

    if (DEBUG) logger.info(FUNC + "uid:", uid);
    if (DEBUG) logger.info(FUNC + "mid:", mid);

    var ret = {
        like_count:0,
        success:false,
    };
    var target = null;
    for (var i = gProposeCache.length - 1; i >= 0; i--) {
        var propose = gProposeCache[i];
        if (propose.mid == mid) {
            target = propose;
        }
    }
    if (target) {
        ret = target.like(uid);
    }

    if (DEBUG) logger.info(FUNC + "target:", target);
    return ret;
}

/**
 * 刪除留言.
 */
function del(mid) {
    const FUNC = TAG + "del() --- ";
    
    if (DEBUG) logger.info(FUNC + "mid:", mid);
    for (var i = gProposeCache.length - 1; i >= 0; i--) {
        var propose = gProposeCache[i];
        if (propose.mid == mid) {
            // 数组刪除操作
            gProposeCache.splice(i, 1);
            return mid;
        }
    }
    return -1;
}

/**
 * 加载数据库中所有留言.
 */
function loadAll(rows,clear) {
    const FUNC = TAG + "loadAll() --- ";

    // 清空
    if(clear){
        gProposeCache = [];
    }
    if (rows != null) {
        // 赋值
        for (var i = 0; i < rows.length; i++) {
            let record = rows[i];

            var mid = record.id;
            var uid = record.uid;
            var text = record.text;
            var propose = new Propose(mid, uid, text);
            propose.time = record.time;
            if (!record.like_uids) {
                propose.like_uids = [];
            }
            else {
                propose.like_uids = record.like_uids.split(",");
            }
            propose.like_count = record.like_count;
            gProposeCache.push(propose);
        }
        if (DEBUG) logger.info(FUNC + "共加载留言数:", rows.length);
    }
}

