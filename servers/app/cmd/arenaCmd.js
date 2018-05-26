const SysCmd = require('./sysCmd');

/**
 * 登录服务器接口定义
 */

class ArenaCmd extends SysCmd {
    constructor() {
        super();
        this.initReq();
        this.initPush();
        this.initRemote();
    }

    initReq() {
        /**
         * 获取对手PK记录
         */
        this._req.getPKRecord = {
            route: 'game.fishHandler.c_get_pk_record',
            msg: {},
            res: {}
        };

        /**
         * pk对战继续
         * @type {{route: string, msg: {}, res: {}}}
         */
        this._req.pk_match_continue = {
            route: 'game.fishHandler.c_pk_match_continue',
            msg: {},
            res: {}
        };

        super.initReq();
    }

    initPush() {
        super.initPush();
        /**
         * 竞技场实时对战开始
         * @type {{route: string, msg: {}}}
         */
        this._push.arenaSyncStart = {
            route: 's_arena_match_syncStart',
            msg: {}
        };

        /**
         * 竞技场异步对战开始
         * @type {{route: string, msg: {}}}
         */
        this._push.arenaAsyncStart = {
            route: 's_arena_match_asyncStart',
            msg: {}
        };

    }
}

module.exports = new ArenaCmd();