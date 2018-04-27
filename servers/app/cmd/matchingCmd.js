const SysCmd = require('./sysCmd');

/**
 * 匹配服务器接口
 */

class MatchingCmd extends SysCmd {
    constructor() {
        super();
        this.initReq();
        this.initPush();
        this.initRemote();
    }

    initReq() {
        super.initReq();

        /**
         * 报名
         */
        this._req.signup = {
            route: 'matching.matchingHandler.c_signup',
            msg: {
                enc: 'aes',
                data: {
                    waitDt: 10, //平均等待时间，单位秒
                }
            },
            res: {}
        };

        /**
         * 取消报名
         */
        this._req.cancle = {
            route: 'matching.matchingHandler.c_cancel',
            msg: {
                enc: 'aes',
                data: {}

            },
            res: {}
        };
    }

    initPush() {
        super.initPush();
        /**
         * 匹配结果
         */
        this._push.matchingResult = {
            route: 's_matching_result',
            msg: {
                enc: 'aes',
                data: {
                    rankMatch:{
                        serverId:'1213',
                        roomId:'1111'
                    },
                    players: [
                        {
                            uid: 201,
                            rank: 14,
                            nickname: 'zhangsan',
                            figure_url: '12312.png',
                            winning_rate: 50,
                            wp_skin: 1,
                            nbomb_cost: 1000, //本次核弹消耗金币
                        },
                        {
                            uid: 202,
                            rank: 14,
                            nickname: 'zhangsan',
                            figure_url: '12312.png',
                            winning_rate: 50,
                            wp_skin: 1,
                            nbomb_cost: 1000, //本次核弹消耗金币
                        },
                    ]
                }
            },
            res: {}
        };
    }

    initRemote(){
        super.initRemote();
        //取消报名
        this._rpc.cancleSigup = {
            route:'rpc_cancle_sigup',
            data:{uid:1000} //取消报名

        };
    }
}

module.exports = new MatchingCmd();