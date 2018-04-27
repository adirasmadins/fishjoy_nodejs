////////////////////////////////////////
// ErrorUtil
// 错误及异常处理工具
//--------------------------------------
// 如何使用
// var ErrorUtil = require('src/buzz/ErrorUtil');
// ErrorUtil.func(str, params...);
////////////////////////////////////////
var ObjUtil = require("./ObjUtil");

exports.checkError = checkError;
exports.throwNullError = throwNullError;
exports.handleDbError = handleDbError;

//==============================================================================

/**
 * 错误检测，出现错误，退出流程，返回调用者一个错误消息.
 * @param condition 检测条件, 传入true或false.
 * @param err_info 错误信息, 如果出现错误, 在服务器console后台和前端显示的文字信息.(// TODO: 使用错误码替代)
 * @param cb 回调函数.
 * return true表示错误发生, 退出流程; false表示没有错误, 继续下面的流程.
 */
function checkError(condition, err_info, cb) {
    if (condition) {
        logger.error(err_info);
        cb(new Error(err_info));
    }
    return condition;
}

function throwNullError(field_name, value) {
    if (ObjUtil.isNull(value)) {
        logger.error("============================================================================");
        logger.error("【ERROR】" + field_name + " is null");
        logger.error("============================================================================");
        // 正式版本中不能有如下语句引起crash
        throw new Error(field_name + " is null");
    }
}

/**
 * 打印数据库报错的日志
 */
function handleDbError(err, sql, sql_data, ERROR, FUNC) {
    if (err) {
        if (ERROR) logger.error(FUNC + "err:\n", err);
        if (ERROR) logger.error(FUNC + "sql:\n", sql);
        if (ERROR) logger.error(FUNC + "sql_data:\n", sql_data);
    }
}

