const SysCmd = require('./sysCmd');

/**
 * 登录服务器接口定义
 */

class HallCmd extends SysCmd {
    constructor() {
        super();
        this.initRemote();
    }

    initRemote(){
        super.initRemote();

        // 玩家登录通知
        this._rpc.player_login = {
            route:'rpc_player_login',
            data:{}
        };
    }
}

module.exports = new HallCmd();