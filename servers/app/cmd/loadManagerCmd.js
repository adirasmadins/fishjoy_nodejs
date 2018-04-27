const SysCmd = require('./sysCmd');

/**
 * 登录服务器接口定义
 */

class BalanceCmd extends SysCmd {
    constructor() {
        super();
        this.initRemote();
    }

    initRemote(){
        super.initRemote();

        //负载均衡
        this._rpc.allock_server = {
            route:'rpc_allock_server',
            data:{}
        };

        this._rpc.getGameLoad = {
            route:'rpc_get_game_load',
            data:{}
        };
    }
}

module.exports = new BalanceCmd();