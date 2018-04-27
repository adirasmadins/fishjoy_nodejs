const SysCmd = require('./sysCmd');

/**
 * 网关接口定义
 */
class GateCmd extends SysCmd{
    constructor(){
        super();
        this.initReq();
        this.initPush();
    }

    initReq(){
        super.initReq();

        /**
         * 分配登录服务器
         * @type {{route: string, msg: {enc: string, data: {token: string}}, res: {}}}
         */
        this._req.queryEntry = {
            route:'gate.gateHandler.c_query_entry',
            msg:{
                enc:'aes',
                data:{
                    token:'03458cd087cb11e7ba758392291a4bfa'
                }

            },
            res:{}
        };
    }

    initPush(){
        super.initPush();
    }
}

module.exports = new GateCmd();