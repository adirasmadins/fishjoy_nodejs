////////////////////////////////////////
// DateUtil
// 日期处理工具集
//--------------------------------------
// 如何使用
// var DateUtil = require('../utils/DateUtil');    // src/dao文件夹
// var DateUtil = require('../src/utils/DateUtil');// routes文件夹
// DateUtil.func(str, params...);
////////////////////////////////////////
// 工具列表
// pattern(date, fmt)
// format(date, fmt)
////////////////////////////////////////

var DEBUG = 0;

const SECONDS_IN_ONE_DAY = 86400;
const MINISECONDS_IN_ONE_DAY = SECONDS_IN_ONE_DAY * 1000;

exports.SECONDS_IN_ONE_DAY = SECONDS_IN_ONE_DAY;
exports.MINISECONDS_IN_ONE_DAY = MINISECONDS_IN_ONE_DAY;

//------------------------------------------------------------------------------
// definition
//------------------------------------------------------------------------------
exports.pattern = _pattern;
exports.format = _format;
exports.dateDiff = _dateDiff;
exports.getDateOffset = _getDateOffset;
exports.diff2 = diff2;
exports.diff = diff;
exports.leftDays = leftDays;
exports.expired = expired;
exports.between = between;
exports.timestamp4zero = timestamp4zero;
exports.getTime = getTime;
exports.getTimeFromDate = getTimeFromDate;
exports.getTimeFromTimestamp = getTimeFromTimestamp;
exports.getLastDateOfThisMonth = getLastDateOfThisMonth;
exports.getLeftTimeToTheEndOfThisMonth = getLeftTimeToTheEndOfThisMonth;
exports.isLastDayOfThisMonth = isLastDayOfThisMonth;
exports.getDaysOfThisMonth = getDaysOfThisMonth;
exports.isToday = isToday;
exports.getHourIdx = getHourIdx;

exports.getNextDay = getNextDay;
exports.getLastHourStart = getLastHourStart;
exports.getLastHourEnd = getLastHourEnd;
exports.getNexyDayBySeconds = getNexyDayBySeconds;
exports.getCurrentByFormat = getCurrentByFormat;
exports.getNextDayByFormat = getNextDayByFormat;

exports.getDateList = getDateList;

//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------


/**
 * date类型转成string
 * 对Date的扩展，将 Date 转化为指定格式的String
 * 月(M)、日(d)、12小时(h)、24小时(H)、分(m)、秒(s)、周(E)、季度(q) 可以用 1-2 个占位符
 * 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
 * eg:
 * (new Date()).pattern("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423
 * (new Date()).pattern("yyyy-MM-dd E HH:mm:ss") ==> 2009-03-10 二 20:09:04
 * (new Date()).pattern("yyyy-MM-dd EE hh:mm:ss") ==> 2009-03-10 周二 08:09:04
 * (new Date()).pattern("yyyy-MM-dd EEE hh:mm:ss") ==> 2009-03-10 星期二 08:09:04
 * (new Date()).pattern("yyyy-M-d h:m:s.S") ==> 2006-7-2 8:9:4.18
 */
Date.prototype.pattern = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours() % 12 == 0 ? 12 : this.getHours() % 12, //小时
        "H+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    var week = {
        "0": "\u65e5",
        "1": "\u4e00",
        "2": "\u4e8c",
        "3": "\u4e09",
        "4": "\u56db",
        "5": "\u4e94",
        "6": "\u516d"
    };
    if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    }
    if (/(E+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, ((RegExp.$1.length > 1) ? (RegExp.$1.length > 2 ? "\u661f\u671f" : "\u5468") : "") + week[this.getDay() + ""]);
    }
    for (var k in o) {
        if (new RegExp("(" + k + ")").test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        }
    }
    return fmt;
};

/**
 * date类型转成string
 * eg:
 * (new Date()).format("yyyyMMddhhmmss") ==> 20161010110655
 */
Date.prototype.format = function (fmt) { //author: meizz   
    var o = {
        "M+": this.getMonth() + 1,               //月份
        "d+": this.getDate(),                    //日
        "h+": this.getHours(),                   //小时
        "m+": this.getMinutes(),                 //分
        "s+": this.getSeconds(),                 //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds()             //毫秒
    };
    if (/(y+)/.test(fmt))
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt))
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
};


//==============================================================================
// 模块输出
//==============================================================================

/**
 * 格式化日期，以string的形式输出
 */
function _pattern(date, fmt) {
    return date.pattern(fmt);
}

/**
 * 格式化日期，以string的形式输出
 */
function _format(date, fmt) {
    return date.format(fmt);
}

/**
 * 返回两个日期之间相差的天数
 */
function _dateDiff(sDate1, sDate2) {    //sDate1和sDate2是2006-12-18格式
    var aDate, oDate1, oDate2, iDays;
    aDate = sDate1.split("-");
    oDate1 = new Date(aDate[1] + '-' + aDate[2] + '-' + aDate[0]);    //转换为12-18-2006格式  
    aDate = sDate2.split("-");
    oDate2 = new Date(aDate[1] + '-' + aDate[2] + '-' + aDate[0]);
    iDays = parseInt(Math.abs(oDate1 - oDate2) / 1000 / 60 / 60 / 24);    //把相差的毫秒数转换为天数  
    return iDays;
}

/**
 * 获得当前日期的偏移值.
 * @add_day_count 以基准日期向前（-x）向后（+x）推算
 * @base_date 基准日期，如果没有指定则使用系统当前日期
 */
function _getDateOffset(add_day_count, base_date) {
    if (!base_date) {
        base_date = new Date();
    }
    base_date.setDate(base_date.getDate() + add_day_count);
    return base_date.pattern("yyyy-MM-dd");
}

////////////////////////////////////////////////////////////

function diff2(targettime, endtime) {
    var _targettime = new Date(targettime);
    var _endtime = new Date(endtime);
    if (DEBUG) logger.info("targettime: ", targettime);
    if (DEBUG) logger.info("endtime: ", endtime);
    return _targettime.getTime() - _endtime.getTime();
}

function diff(endtime) {
    var curtime = new Date();
    var _endtime = new Date(endtime);
    if (DEBUG) logger.info("curtime: ", curtime);
    if (DEBUG) logger.info("endtime: ", endtime);
    return curtime.getTime() - _endtime.getTime();
}

function leftDays(starttime) {
    var curtime = new Date();
    var _starttime = new Date(starttime);
    if (DEBUG) logger.info("curtime: ", curtime);
    if (DEBUG) logger.info("starttime: ", starttime);

    var leftMillionSeconds = _starttime.getTime() - curtime.getTime();
    if (leftMillionSeconds < 0) {
        return 0;
    }
    return Math.ceil(leftMillionSeconds / 86400000);
}

function expired(endtime) {
    return diff(endtime) > 0;
}

function between(curtime, starttime, endtime) {
    var start = diff2(curtime, starttime);
    var end = diff2(curtime, endtime);
    if (DEBUG) logger.info("start: ", start);
    if (DEBUG) logger.info("end: ", end);
    return start > 0 && end < 0;
}

/**
 * 获取当日零时的时间戳
 */
function timestamp4zero() {
    var date = new Date();
    var year = date.getFullYear();   //获取完整的年份(4位,1970-????)  
    var month = date.getMonth() + 1;      //获取当前月份(0-11,0代表1月)  
    var day = date.getDate();       //获取当前日(1-31)  
    return new Date(year + "/" + month + "/" + day).getTime();
}

/**
 * 获取当前时间(使用fmt进行格式化)
 */
function getCurrentByFormat(fmt) {
    return _format(new Date(), fmt);
}

function getNextDayByFormat(fmt) {
    return _format(new Date(new Date().getTime() + 24*3600*1000), fmt);
}

function getTime() {
    return _format(new Date(), "yyyy-MM-dd hh:mm:ss");
}

function getTimeFromDate(date) {
    return _format(date, "yyyy-MM-dd hh:mm:ss");
}

function getTimeFromTimestamp(timestamp) {
    return _format(new Date(timestamp), "yyyy-MM-dd hh:mm:ss");
}

/**
 * 获取这个月最后一天的时间戳.
 */
function getLastDateOfThisMonth() {
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = new Date(year, month, 0);
    var lastdate = year + '-' + month + '-' + day.getDate();
    return lastdate;
}

/**
 * 获取当前时间到月末最后一天晚的剩余时间.
 */
function getLeftTimeToTheEndOfThisMonth() {
    var lastdate = getLastDateOfThisMonth();
    var timestamp = new Date(lastdate).getTime();
    timestamp += MINISECONDS_IN_ONE_DAY;
    return Math.ceil((timestamp - new Date().getTime()) / 1000);
}

/**
 * 判断当前是否当月最后一天
 */
function isLastDayOfThisMonth() {
    var lastdate = getLastDateOfThisMonth();

    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    var thisdate = year + '-' + month + '-' + day;
    return lastdate == thisdate;
}

/**
 * 获取这个月的天数.
 */
function getDaysOfThisMonth() {
    var temp = new Date();
    var year = temp.getYear();
    var month = temp.getMonth() + 1;
    var d = new Date(year, month, 0);
    return d.getDate();
}

/**
 * 判断一个时间戳是否今日
 * @param timestamp 时间戳或日期对象.
 */
function isToday(timestamp) {
    var today = new Date().getDate();
    var target = new Date(timestamp).getDate();
    if (today == target) {
        return true;
    }
    return false;
}

/**
 * 获取小时的索引值.
 */
function getHourIdx() {
    return new Date().getHours();
}

/**
 * 获取指定日期的下一天
 */
function getNextDay(d) {
    d = new Date(d);
    d = +d + 1000 * 60 * 60 * 24;
    d = new Date(d);
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
}

/**
 * 输入: 2017-09-05 20:00:01
 * 输出: 2017-09-05 19:00:00
 */
function getLastHourStart() {
    let d = new Date();
    d = +d - 1000 * 60 * 60;
    d = Math.floor(d / (1000 * 60 * 60)) * 1000 * 60 * 60;
    d = new Date(d);
    return d.format("yyyy-MM-dd hh:mm:ss");
}

/**
 * 输入: 2017-09-05 20:00:01
 * 输出: 2017-09-05 20:00:00
 */
function getLastHourEnd() {
    let d = new Date();
    d = +d;
    d = Math.floor(d / (1000 * 60 * 60)) * 1000 * 60 * 60;
    d = new Date(d);
    return d.format("yyyy-MM-dd hh:mm:ss");
}

/**
 * 距离明天还有多少秒
 */
function getNexyDayBySeconds() {
    var today = new Date();
    var hours = today.getHours();
    var minutes = today.getMinutes();
    var sec = today.getSeconds();
    return (24 * 3600 - hours * 3600 - minutes * 60 - sec);
}

/**
 * 给定开始和结束的日期(yyyy-MM-dd)， 获取这段时间跨过的所有日期列表
 */
function getDateList(start_date, end_date) {
    // 获取入参字符串形式日期的Date型日期
    var st = new Date(start_date);
    var et = new Date(end_date);
      
    var retArr = [];

    // 获取开始日期的年，月，日
    var yyyy = st.getFullYear(),
        mm = st.getMonth(),
        dd = st.getDate();
      
    st = new Date(yyyy, mm, dd++);
    // 循环
    while (st.getTime() < et.getTime()) {
        // logger.info('st:', st.getTime());
        retArr.push(_format(st, 'yyyy-MM-dd'));
          
        // 使用dd++进行天数的自增
        st = new Date(yyyy, mm, dd++);
    }
  
    // 将结束日期的天放进数组  
    // retArr.push(end_date);

    return retArr;
}