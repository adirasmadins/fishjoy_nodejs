const ERROR_OBJ = require('../../consts/fish_error').ERROR_OBJ;
const answer = require('../../utils/answer');
const serviceSwitch = require('./serviceSwitch');
class HttpSwitchFilter{
    constructor(){

    }

    async before(ctx, next) {
        if(serviceSwitch.status == 1){
            ERROR_OBJ.SERVICE_SWITCH.msg = serviceSwitch.msg || ERROR_OBJ.SERVICE_SWITCH.msg;
            ctx.body = answer.httpResponse(ERROR_OBJ.SERVICE_SWITCH, false, true);
            return;
        }

        if(serviceSwitch.getApiLockStatus(ctx.url)){
            ctx.body = answer.httpResponse(ERROR_OBJ.API_SWITCH, false, true);
            return;
        }

        await next();
    }

    async after(ctx, next) {
        await next();
    }

}

module.exports = new HttpSwitchFilter();