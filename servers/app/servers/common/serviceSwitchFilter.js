/**
 * 过滤未登陆用户请求
 */
const ERROR_OBJ = require('../../consts/fish_error').ERROR_OBJ;
const serviceSwitch = require('./serviceSwitch');
const answer = require('../../utils/answer');

class ServiceSwitchFilter{
    before(msg, session, next) {
        if(serviceSwitch.status == 1){
            ERROR_OBJ.SERVICE_SWITCH.msg = serviceSwitch.msg || ERROR_OBJ.SERVICE_SWITCH.msg;
            next(ERROR_OBJ.SERVICE_SWITCH, answer.respNoData(ERROR_OBJ.SERVICE_SWITCH));
            return;
        }
        next();
    }
}

module.exports = new ServiceSwitchFilter();