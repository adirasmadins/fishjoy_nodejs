const moment  = require('moment');

const ONE_DAY = 86400000;
const FMT_DT = 'YYYY-MM-DD HH:mm:ss';
const FMT_D = 'YYYY-MM-DD';
const FMT_DB = 'YYYYMMDD';
const FMT_T = 'HH:mm:ss';
const FMT_THM = 'HH:mm';
const FMT_mm = 'mm';

exports.getDateList = getDateList;
exports.make24Hour = make24Hour;
exports.getHourRange = getHourRange;
exports.getDateListFrom = getDateListFrom;
exports.getDateBefore = getDateBefore;
exports.getDateAfterFrom = getDateAfterFrom;
exports.getDateAfter =getDateAfter;
exports.format = format;
exports.getTimeBefoe = getTimeBefoe;
exports.getIdxOfHour = getIdxOfHour;
exports.getLastHourStart = getLastHourStart;
exports.getLastHourEnd = getLastHourEnd;
exports.FMT = {
    DT: FMT_DT,
    DB: FMT_DB,
    D: FMT_D,
    T: FMT_T,
    THM: FMT_THM,
};

/**
 * 获取当前是创建账号的第几日
 * @param {*} created_at 创建日期
 */
exports.getDayNth = (created_at) => {
    let time1 = moment(created_at).format('YYYY-MM-DD');
    let time2 = moment().format('YYYY-MM-DD');
    logger.error('time1:', time1);
    logger.error('time2:', time2);
    return moment(time2).diff(moment(time1), 'days') + 1;
}

/**
 * 输入: 2017-09-05 20:00:01
 * 输出: 2017-09-05 19:00:00
 */
function getLastHourStart() {
    let d = new Date();
    d = +d - 1000 * 60 * 60;
    d = Math.floor(d / (1000 * 60 * 60)) * 1000 * 60 * 60;
    return moment(new Date(d)).format(FMT_DT);
}

/**
 * 输入: 2017-09-05 20:00:01
 * 输出: 2017-09-05 20:00:00
 */
function getLastHourEnd() {
    let d = new Date();
    d = +d;
    d = Math.floor(d / (1000 * 60 * 60)) * 1000 * 60 * 60;
    return moment(new Date(d)).format(FMT_DT);
}

/**
 * 获取指定时间往前xx秒的时间
 * @param {*} time 
 */
function getTimeBefoe(time, before) {
    return new Date(new Date(time).getTime() - before);
}

/**
 * 获取时间点所处当前小时的范围(1~6)
 * @param {*} time 
 */
function getIdxOfHour(time) {
    let minutes = (new Date(time)).getMinutes();
    return Math.ceil(minutes / 10);
}

/**
 * 格式化时间
 * @param {*} time 
 * @param {*} fmt 
 */
function format(time, fmt) {
    return moment(new Date(time)).format(fmt);
}

/**
 * 获取从当前时间往前dayCount天的日期
 */
function getDateBefore(dayCount) {
    return new Date(new Date().getTime() - (ONE_DAY * dayCount));
}

/**
 * 获取从当前时间往后dayCount天的日期
 */
function getDateAfter(dayCount) {
    return new Date(new Date().getTime() + (ONE_DAY * dayCount));
}

/**
 * 获取从指定日期往后dayCount天的日期
 */
function getDateAfterFrom(date, dayCount) {
    return new Date(new Date(date).getTime() + (ONE_DAY * dayCount));
}

/**
 * 给定开始和结束的日期(yyyy-MM-dd)， 获取这段时间跨过的所有日期列表
 */
function getDateList(start_date, end_date, format) {
    // 获取入参字符串形式日期的Date型日期
    let st = new Date(start_date);
    let et = new Date(end_date);

    let retArr = [];

    // 获取开始日期的年，月，日
    let yyyy = st.getFullYear(),
        mm = st.getMonth(),
        dd = st.getDate();

    st = new Date(yyyy, mm, dd++);
    // 循环
    while (st.getTime() < et.getTime()) {
        if (format) {
            retArr.push(moment(st).format(format));
        }
        else {
            retArr.push(moment(st).format('yyyy-MM-dd'));
        }

        // 使用dd++进行天数的自增
        st = new Date(yyyy, mm, dd++);
    }

    return retArr;
}

/**
 * 给定指定日期的24小时查询范围
 * @param {*} date 
 */
function make24Hour(date) {
    let ret = [];
    for (let i = 0; i < 24; i++) {
        let hour = '0' + i;
        if (i >= 10) {
            hour = '' + i;
        }
        ret.push({
            start: date + ' ' + hour + ':00:00',
            end: date + ' ' + hour + ':59:59',
            range: hour + ':00~' + hour + ':59',
        });
    }
    // logger.error('ret:\n', ret);
    return ret;
}

/**
 * 获取每小时的时段显示00:00~00:59
 * @param {*} time 时间点
 */
function getHourRange(time) {
    let date = new Date(time);
    let start = moment(date).format('HH:00');
    let end = moment(date).format('HH:59');
    return start + '~' + end;
}

/**
 * 获取日期列表
 * @param {String} time 时间点
 * @param {Number} num 从时间点算起的天数
 * @param {String} type 日期增加还是减少(incr, decr), 默认为incr
 */
function getDateListFrom(time, num, type='incr') {
    let start_date = new Date(time);
    let end_date = new Date(time);
    if ('decr' == type) {
        start_date = new Date(start_date.getTime() - (ONE_DAY * (num - 1)));
    }
    else {
        end_date = new Date(start_date.getTime() + (ONE_DAY * (num - 1)));
    }
    start_date = moment(start_date).format('YYYY-MM-DD');
    end_date = moment(end_date).format('YYYY-MM-DD');
    list = getDateList(start_date, end_date, 'YYYY-MM-DD');

    return list.reverse();
}