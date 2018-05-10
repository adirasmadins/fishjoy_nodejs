////////////////////////////////////////
// ObjUtil
// 对象处理工具集
//--------------------------------------
// 如何使用
// var ObjUtil = require('src/buzz/ObjUtil');
// ObjUtil.func(obj, params...);
////////////////////////////////////////

//==============================================================================
// import
//==============================================================================
var _ = require('underscore');
var StringUtil = require('../utils/StringUtil');
var ArrayUtil = require('../utils/ArrayUtil');


//==============================================================================
// constant
//==============================================================================
var DEBUG = 0;
var ERROR = 1;

var TAG = "【ObjUtil】";


//==============================================================================
// public
//==============================================================================

//------------------------------------------------------------------------------
// definition
//------------------------------------------------------------------------------
exports.merge = merge;
exports.mergeItemList = mergeItemList;
exports.str2Data = str2Data;
exports.str2Arr = str2Arr;
exports.data2String = data2String;
exports.getPlayerName = getPlayerName;
exports.update = update;
exports.cost = cost;
exports.enough = enough;
exports.isNull = isNull;
exports.noNull = noNull;
exports.isEmpty = isEmpty;
exports.length = length;
exports.exclude = exclude;

// exports.TimeQueue = TimeQueue;// 时间队列对象
// exports.Broadcast = Broadcast;// 公告对象

//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------
function merge(o1, o2) {
    for (var key in o2) {
        o1[key] = o2[key];
    }
    return o1;
}

/**
l1 = [
    { item_id: 'i001', item_num: 9000 },
    { item_id: 'i103', item_num: 18 }
]
l2 = [
    { item_id: 'i001', item_num: 9500 },
    { item_id: 'i103', item_num: 19 }
]
mergeItemList(l1, l2) = [
    { item_id: 'i001', item_num: 18500 },
    { item_id: 'i103', item_num: 37 }
]
 */
function mergeItemList(l1, l2) {

    var o1 = arr2obj(l1);
    var o2 = arr2obj(l2);

    for (var idx in o2) {
        if (!_.isUndefined(o1[idx])) {
            o1[idx] += o2[idx];
        }
        else {
            o1[idx] = o2[idx];
        }
    }

    // logger.info("o1:", o1);

    return obj2arr(o1);
}

function arr2obj(arr) {
    var ret = {};
    for (var i = 0; i < arr.length; i++) {
        var item = arr[i];
        if (!ret[item.item_id]) {
            ret[item.item_id] = item.item_num;
        }
        else {
            ret[item.item_id] += item.item_num;
        }
    }
    return ret;
}

function obj2arr(obj) {
    var ret = [];
    for (var idx in obj) {
        ret.push({
            item_id: idx,
            item_num: obj[idx],
        });
    }
    return ret;
}

//'{\"stat\":1,\"timestamp\":1510101391259,\"id\":0}'
function str2Data(data) {
    const FUNC = TAG + "str2Data()---";

    if (data == null || typeof(data) == "undefined" || data == "" || data == "undefined") {
        return {};
    }

    var ret = null;
    if (StringUtil.isString(data)) {
        if (StringUtil.startsWith(data, '"')){
            data = StringUtil.subString(data, 1, data.length);
        }
        if (StringUtil.endsWith(data, '"')){
            data = StringUtil.subString(data, 0, data.length-1);
        }

        // TODO: BUG(20170407【8】)
        try {
            ret = JSON.parse(data);
        }
        catch (err) {
            if (ERROR) logger.error(FUNC + "2.Parse Error, data:\n", data);
            throw err;// 依然抛出
        }
        return ret;
    }
    else {
        return data;
    }
}

function str2Arr(data) {
    const FUNC = TAG + "str2Arr()---";

    if (data == null || typeof(data) == "undefined" || data == "" || data == "undefined") {
        return [];
    }

    var ret = null;
    if (StringUtil.isString(data)) {
        if (StringUtil.startsWith(data, '"') && StringUtil.endsWith(data, '"')) {
            if (ERROR) logger.error(FUNC + "1.Parse Error, data:\n", data);
            data = StringUtil.subString(data, 1, data.length - 1);
        }
        // TODO: BUG(20170407【8】)
        try {
            ret = JSON.parse(data);
        }
        catch (err) {
            if (ERROR) logger.error(FUNC + "2.Parse Error, data:\n", data);
            throw err;// 依然抛出
        }
        return ret;
    }
    else {
        return data;
    }
}

function data2String(data) {
    var ret = null;
    if (!StringUtil.isString(data)) {
        ret = JSON.stringify(data);
        return ret;
    }
    else {
        return data;
    }
}

function isNull(obj) {
    return obj == null || typeof(obj) == "undefined" || obj == "null" || obj == "undefined";
}

function noNull(data) {
    return data == null ? {} : data;
}

function isEmpty(data) {
    return data == null || typeof(data) == "undefined" || data == {};
}

function getPlayerName(data) {
    const FUNC = TAG + "getPlayerName() --- ";

    var ret = data.nickname;
    if (ret == null) {
        ret = data.channel_account_name;
    }
    if (ret == null) {
        ret = data.tempname;
    }
    // logger.info(FUNC + "ret:", ret);
    return ret;
}

/**
 * 1. 已有对象数字增加
 * 2. 没有的就直接插入一个对象
 * update({"i1":1, "i2":2}, {"i1":2, "i3":3}) = {"i1":3, "i2":2, "i3":3}
 */
function update(obj_old, obj_new) {
    //logger.info("obj_old:", obj_old);
    //logger.info("obj_new:", obj_new);
    for (var key in obj_new) {
        // logger.info("(...)key:", key);
        // logger.info("(...)obj_old[key]:", obj_old[key]);
        // logger.info("(...)obj_new[key]:", obj_new[key]);
        if (obj_old[key] == null) {
            obj_old[key] = obj_new[key];
        }
        else {
            //logger.info("(1)obj_old[key]:", obj_old[key]);
            obj_old[key] = obj_old[key] + obj_new[key];
            //logger.info("(2)obj_old[key]:", obj_old[key]);
        }
    }
    return obj_old;
}

/**
 * 1. 已有对象数字减少
 * 2. 没有的就报错
 * 3. 物品不够的就报错
 * 4. 用完的物品就直接delete
 * cost({"i1":3, "i2":2, "i3":3}, {"i1":2, "i3":3}) = {"i1":1, "i2":2, "i3":0}
 */
function cost(obj_old, obj_new, cb) {
    for (var key in obj_new) {
        if (obj_old[key] == null) {
            //throw new Error("没有找到消耗物品:" + key);
            obj_old[key] = 0;
            // throw new Error({code: 12345, msg: "没有找到消耗物品:" + key});
        }
        // else {
            if (obj_old[key] < obj_new[key]) {
                cb({ code: 12346, msg: "消耗物品数量不足, 需要" + obj_new[key] + ", 实际拥有" + obj_old[key] });
                return;
            }
            obj_old[key] = obj_old[key] - obj_new[key];
            //if (obj_old[key] == 0) {
            //    delete obj_old[key];
            //}
        // }
    }
    return obj_old;
}

/**
 * 返回还差的对象个数
 * enough({"i1":3, "i2":2, "i3":3}, {"i1":5, "i3":4}) = {"i1":2, "i3":1}
 */
function enough(obj_old, obj_new) {
    var ret = {};
    for (var key in obj_new) {
        if (obj_old[key] == null) {
            ret[key] = obj_new[key];
        }
        else {
            if (obj_old[key] < obj_new[key]) {
                ret[key] = obj_new[key] - obj_old[key];
            }
        }
    }
    return ret;
}

function length(obj) {
    return _.keys(obj).length;
}

/**
 * 生成一个新的对象, 排除指定键.
 */
function exclude(obj, key_list) {
    var ret = {};
    for (var key in obj) {
        if (!ArrayUtil.contain(key_list, key)) {
            ret[key] = obj[key];
        }
    }
    return ret;
}

/**
 * 克隆一个对象
 * 注意是递归操作，慎用
 */
exports.clone = function (obj) {
    var buf;  
    if (obj instanceof Array) {  
        buf = [];  //创建一个空的数组
        var i = obj.length;  
        while (i > 0 && i--) {  
            buf[i] = this.clone(obj[i]);  
        }  
        return buf;  
    }else if (obj instanceof Object){  
        buf = {};  //创建一个空对象
        for (var k in obj) {  //为这个对象添加新的属性
            buf[k] = this.clone(obj[k]);  
        }  
        return buf;  
    }
    return obj; 
};

// //----------------------------------------------------------
// // Broadcast
// //----------------------------------------------------------
// function Broadcast(timestamp, content) {
//     this.timestamp = timestamp;
//     this.content = content;
// }

// //----------------------------------------------------------
// // TimeQueue
// //----------------------------------------------------------
// /**
//  * timeInterval 检测时间间隔, 单位是毫秒.
//  * timeOffset 超过此时间间隔长度的对象将被移除出队列.
//  * recentRetLength 返回给客户端的公告内容条数.
//  * maxQueueLength 队列的最大长度.
//  */
// function TimeQueue(timeInterval, timeOffset, recentRetLength, maxQueueLength) {
//     this.queue = [];
//     this.timeInterval = timeInterval;
//     this.recentRetLength = recentRetLength;
//     this.maxQueueLength = maxQueueLength;

//     var crossQueue = this.queue;
//     setInterval(function () {
//         if (DEBUG) logger.info('检测时间队列');
//         var currentTimesamp = Date.parse(new Date());
//         for (var i = 0; i < crossQueue.length; i++) {
//             var broadcast = crossQueue[i];
//             if (broadcast) {
//                 if (currentTimesamp - timeOffset > broadcast.timestamp) {
//                     crossQueue.shift();
//                 }
//                 else {
//                     break;
//                 }
//             }
//         }
//     }, this.timeInterval);
// }

// TimeQueue.prototype.push = function (broadcast) {
//     if (this.queue.length >= this.maxQueueLength) {
//         this.queue.shift();
//     }
//     this.queue.push(broadcast);
// };

// TimeQueue.prototype.getRecent = function (timestamp) {
//     var start = this.queue.length - Math.min(this.recentRetLength, this.queue.length);
//     var ret = [];
//     for (var i = start; i < this.queue.length; i++) {
//         var oneBroadcast = this.queue[i];
//         if (!timestamp || timestamp < oneBroadcast.timestamp) {
//             ret.push(this.queue[i]);
//         }
//     }
//     return ret;
// };