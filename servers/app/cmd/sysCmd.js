class SysCmd {
    constructor() {
        this._req = {};
        this._push = {};
        this._rpc = {};
    }

    /**
     * 初始化请求接口定义
     */
    initReq() {}

    /**
     * 初始化推送消息接口定义
     */
    initPush() {}

    initRemote() {}

    get request() {
        return this._req;
    }

    get remote(){
        return this._rpc;
    }

    get push(){
        return this._push;
    }
}

module.exports = SysCmd;