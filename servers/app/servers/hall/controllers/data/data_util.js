////////////////////////////////////////////////////////////////////////////////
// 数据接口的通用工具类
// request_info
// get_data
////////////////////////////////////////////////////////////////////////////////

//==============================================================================
// import
//==============================================================================
var buzz_cst_game = require('../../src/buzz/cst/buzz_cst_game');

//==============================================================================
// const
//==============================================================================
var DEBUG = 0;
var ERROR = 1;

var TAG = "【data_util】";

//==============================================================================
// public
//==============================================================================

//------------------------------------------------------------------------------
// definition
//------------------------------------------------------------------------------
exports.request_info = request_info;
exports.get_dao_data = get_dao_data;
exports.handleReturn = handleReturn;
exports.parseDataObj = parseDataObj;

//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------

/**
 * 打印请求信息
 */
function request_info(req, func_name) {
    if (DEBUG) logger.info("call " + func_name + "()...");
    if (DEBUG) logger.info("req: " + req);
    if (DEBUG) logger.info("req.body: " + JSON.stringify(req.body));
    if (DEBUG) logger.info("req.params: " + JSON.stringify(req.params));
}

/**
 * 获取DAO能处理的数据
 */
function get_dao_data(req, res) {
    var dataObj = {};
    try {
        dataObj = buzz_cst_game.getDataObj(req.body.data, req.body.aes);
    }
    catch (json_parse_err) {
        res.success({ type: 1, msg: '获取用户参数出错, 用户没有传入任何参数', err: '' + json_parse_err });
        return false;
    }
    return dataObj;
}

/**
 * 解析请求中的数据格式.
 * @param res 响应对象.
 * @param aes 是否加密标记.
 * @param err 错误对象, 不为空时返回此对象.
 * @param result 返回对象.
 * @param hint 提示信息.
 */
function handleReturn(res, aes, err, result, hint) {
    const FUNC = TAG + "handleReturn() --- ";
    if (err) {
        if (ERROR) logger.error(FUNC + "msg:", hint + "失败");
        if (ERROR) logger.error(FUNC + "err:", err);
        res.success({ type: 1, msg: hint + "失败", err: err });
    } else {
        var res_data = buzz_cst_game.getResData(result, aes);
        res.success({ type: 1, msg: hint + "成功", data: res_data, aes: aes });
    }
}

/**
 * 解析请求中的数据格式.
 * @param req 请求对象.
 * @param hint 提示信息.
 */
function parseDataObj(req, hint) {
    var dataObj = {};

    try {
        dataObj = buzz_cst_game.getDataObj(req.body.data, req.body.aes);
    }
    catch (json_parse_err) {
        if (ERROR) logger.error("msg:", hint + "失败(json解析错误)");
        if (ERROR) logger.error("err:", json_parse_err);
    }

    return dataObj;
}


//==============================================================================
// private
//==============================================================================

