////////////////////////////////////////
// StringUtil
// 通用工具集
//--------------------------------------
// 如何使用
// var CommonUtil = require('src/buzz/CommonUtil');
// CommonUtil.func(str, params...);
////////////////////////////////////////
var ObjUtil = require('./ObjUtil');

var ERROR_OBJ = require('../../../../consts/fish_error').ERROR_OBJ;
var ERROR = 1;

exports.isParamExist = isParamExist;

function isParamExist(module, param, err_info, cb) {
    if (param == null) {
        var extraErrInfo = { debug_info: module + "._isParamExist()-" + err_info };
        if (ERROR) logger.error('------------------------------------------------------');
        if (ERROR) logger.error(extraErrInfo.debug_info);
        if (ERROR) logger.error('------------------------------------------------------');
        if (cb == null) logger.error('!!!!!!!!!!!!!!!!!!!!!!!');
        cb(ObjUtil.merge(extraErrInfo, ERROR_OBJ.PARAM_MISSING));
        return false;
    }
    return true;
}
