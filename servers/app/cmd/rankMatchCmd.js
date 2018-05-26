const SysCmd = require('./sysCmd');

/**
 * 登录服务器接口定义
 */

class RankMatchCmd extends SysCmd {
    constructor() {
        super();
        this.initReq();
        this.initPush();
        this.initRemote();
    }

    initReq() {
        super.initReq();
    }

    initPush() {
        super.initPush();

        //排位赛正式开始：双方已就绪
        this._push.start = {
            route: 's_rank_match_start',
            msg: {
                enc: 'aes',
                data: {
                    countdown:100, //倒计时（单位:s）
                }
            }
        },
        
        //排位赛倒计时
        this._push.timer = {
            route: 's_rank_match_timer',
            msg: {
                enc: 'aes',
                data: {
                   countdown:100, //倒计时（单位:s）
                }
            }
        },

        /**
         * 战斗信息
         */
        this._push.fightInfo = {
            route: 's_rank_match_fight_info',
            msg: {
                enc: 'aes',
                data: {
                    uid: 12312,
                    roomId: '23423',
                    score:100, //当前得分
                    fire: 100, //剩余子弹数
                    fish_list: [
                        {key: 'fish1', point: 1},
                        {key: 'fish2', point: 2},
                    ]
                }
            },
        };

        /**
         * 武器切换通知
         */
        this._push.weaponChange = {
            route: 's_rank_match_weapon_skin_change',
            msg: {
                enc: 'aes',
                data: {
                    uid: 1001,
                    wp_skin: 1,
                }
            },
        };

        //使用核弹
        this._push.useNbomb = {
            route:'s_rank_match_use_nbomb',
            data:{
                uid:10001,
                roomId: '100202',
                score: 1212, //当前总分
                nbomb: {
                    num: 10,
                    point: 1212,
                },
            }
        };

        //取消核弹
        this._push.cancelNbomb = {
            route:'s_rank_match_cancel_nbomb',
            data:{
                uid:10001,
                roomId: '100202',
            }
        };

        /**
         * pk结算
         */
        this._push.pkResult = {
            route: 's_rank_match_pk_result',
            msg: {
                enc: 'aes',
                data: {
                }
            }
        };

        /**
         * 聊天
         */
        this._push.rmatchChat = {
            route: 's_rank_match_chat',
            msg: {
                enc: 'aes',
                data: {
                    seatId: 1,
                    type: 0, //0 文本 1图片 2语音
                    idx: 0, //模板索引,-1自定义内容
                    data: null, //对应类型的自定义内容,
                    matchFlag: 0, //0战斗同房间广播, 非0只在具体比赛选择中广播
                }
            },
            res: {}
        };

        //魅惑对手
        this._push.provocative = {
            route:'s_rank_match_provocative',
            data:{
                uid:10001,
                provocativeVal: 2,
            }
        };

         /**
         * 1v1玩家进入广播
         */
        this._push.enter_room_1v1 = {
            route: 's_match_1v1_enter',
            msg: {
                enc: 'aes',
                data: { }
            },
            res: {}
        };
    }

    initRemote(){
        super.initRemote();
        //加入比赛
        this._rpc.join = {
            route:'rpc_join',
            data:[] //玩家基础信息

        };

        //发送准备状态
        this._rpc.ready = {
            route:'rpc_ready',
            data:{
                uid:10001,
                roomId: '100202',
                gameSid:'game-server-1' //游戏服务ID
            }
        };

        this._rpc.query_playerInfo = {
            route:'rpc_query_playerInfo',
            data:{
                roomId: '100202'
            }
        };

        //武器皮肤切换
        this._rpc.weaponChange = {
            route:'rpc_weapon_change',
            data:{
                uid: 1001,
                wp_skin: 1,
            }
        };

        //普通开炮信息
        this._rpc.fightInfo = {
            route:'rpc_fight_info',
            data:{
                uid:10001,
                roomId: '100202',
                fire: 99, //剩余子弹数
                score: 1212, //当前总分
                fish_list: {
                    'fishName1': {
                        num: 1,
                        point: 22,
                    },
                    'fishName2': {
                        num: 1,
                        point: 22,
                    },
                } //最近打死鱼信息
            }
        };

        //使用核弹
        this._rpc.useNbomb = {
            route:'rpc_use_nbomb',
            data:{
                uid:10001,
                roomId: '100202',
                score: 1212, //当前总分
                nbomb: {
                    num: 10,
                    point: 1212,
                },
            }
        };

        //取消核弹
        this._rpc.cancelNbomb = {
            route:'rpc_cancel_nbomb',
            data:{
                uid:10001,
                roomId: '100202',
            }
        };

        //排位赛聊天
        this._rpc.rmatchChat = {
            route: 'rpc_rank_match_chat',
            data: {
                seatId: 1,
                type: 0, //0 文本 1图片 2语音
                idx: 0, //模板索引,-1自定义内容
                data: null, //对应类型的自定义内容,
                matchFlag: 0, //0战斗同房间广播, 非0只在具体比赛选择中广播
            }
        };

         //魅惑对手
         this._rpc.provocative = {
            route:'rpc_rank_match_provocative',
            data:{
                uid: 10001,
                provocativeVal: 2,
            }
        };
        
    }
}

module.exports = new RankMatchCmd();