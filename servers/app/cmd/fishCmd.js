const SysCmd = require('./sysCmd');
class FishCmd extends SysCmd {
    constructor() {
        super();
        this.initReq();
        this.initPush();
        this.initRemote();
    }

    initReq() {
        super.initReq();

        /**
         * 心跳协议
         * @type {{}}
         */
        this._req.heartbeat = {
            route: 'game.fishHandler.c_heartbeat',
            msg: {
                enc: 'aes',
                data: {}
            },
            res: {}
        };


        /**
         * 登录
         * @type {{route: string, msg: {enc: string, data: {token: string, flag: boolean, scene_name: string}}, res: {}}}
         */
        this._req.login = {
            route: 'game.fishHandler.c_login',
            msg: {
                enc: 'aes',
                data: {
                    token: '52_03458cd087cb11e7ba758392291a4bfa'
                }
            },
            res: {}
        };

        /**
         * 注销
         * @type {{route: string, msg: {enc: string, data: {token: string, flag: boolean, scene_name: string}}, res: {}}}
         */
        this._req.logout = {
            route: 'game.fishHandler.c_logout',
            msg: {},
            res: {}
        };

        /**
         * 加入游戏房间
         * @type {{route: string, msg: {enc: string, data: {token: string, flag: boolean, scene_name: string}}, res: {}}}
         */
        this._req.enterGame = {
            route: 'game.fishHandler.c_enter_room',
            msg: {
                enc: 'aes',
                data: {
                    flag: 0, // 0单人房 1多人房 2排位赛
                    scene_name: 'scene_mutiple_1', //准备进入的场景名,
                    recover: {
                        game: {
                            serverId: 'game-server-1',
                            roomId: '100202'
                        },
                        rankMatch: {
                            serverId: '1213',
                            roomId: '1111'
                        }
                    }
                }
            },
            res: {}
        };


        /**
         * 离开游戏房间
         * @type {{route: string, msg: {enc: string, data: {}}, res: {}}}
         */
        this._req.leaveGame = {
            route: 'game.fishHandler.c_leave_room',
            msg: {
                enc: 'aes',
                data: {}

            },
            res: {}
        };

        /**
         * 通知服务器从redis中及时取数据同步缓存
         * @type {{route: string, msg: {enc: string, data: {}}, res: {}, description: string}}
         */
        this._req.player_notify = {
            route: 'game.fishHandler.c_player_notify',
            msg: {
                enc: 'aes',
                data: {}
            },
            res: {}
        };

        /**
         * 查询当前房间内已经出现的鱼、对应已走过的时间和路径
         * 返回对象，单个格式，fishKey: [pathKey, seconds]
         * @type {{route: string, msg: {enc: string, data: {wp_skin: number, fire_point: {x: number, y: number}}}, res: {fj_0_0: [string,number], fj_1_0: [string,number], fj_2_0: [string,number]}, description: string}}
         */
        this._req.query_fishes = {
            route: 'game.fishHandler.c_query_fishes',
            msg: {
                enc: 'aes',
                c_fks: []
            },
            res: {
                fj_0_0: ['p_1', 0.2],
                fj_1_0: ['p_2', 0.2],
                fj_2_0: ['p_1', 0.2],
            }
        };

        /**
         * 查询当前房间内在做玩家信息,
         * 注意：返回结果同s_enter_rrom
         */
        this._req.query_players = {
            route: 'game.fishHandler.c_query_players',
            msg: {
                enc: 'aes',
                data: {}
            },
            res: {
                players: [{
                        id: 12312312,
                        seatId: 0,
                        wp_skin: 1,
                        wp_level: 120,
                        gold: 1000,
                        pearl: 10
                    },
                    {
                        id: 12312313,
                        seatId: 1,
                        wp_skin: 2,
                        wp_level: 10,
                        gold: 1000,
                        pearl: 10
                    },
                    {
                        id: 12312314,
                        seatId: 2,
                        wp_skin: 3,
                        wp_level: 100,
                        gold: 1000,
                        pearl: 10
                    },
                    {
                        id: 12312316,
                        seatId: 3,
                        wp_skin: 4,
                        wp_level: 1200,
                        gold: 1000,
                        pearl: 10
                    },
                ]
            }
        };



        /**
         * 发射子弹
         * @type {{route: string, msg: {enc: string, data: {wp_skin: number, fire_point: {x: number, y: number}}}, description: string}}
         */
        this._req.fire = {
            route: 'game.fishHandler.c_fire',
            msg: {
                enc: 'aes',
                data: {
                    wp_skin: 1, //武器皮肤，决定子弹类型
                    fire_point: {
                        x: 0,
                        y: 0
                    } //开火人打击点
                }
            },
            res: {}
        };

        /**
         * 子弹碰撞鱼
         * @type {{route: string, msg: {enc: string, data: {bullet_key: string, wp_skin: number, wp_level: number, skill_ing: number, fish_keys: [string,string]}}, description: string}}
         */
        this._req.catch_fish = {
            route: 'game.fishHandler.c_catch_fish',
            msg: {
                enc: 'aes',
                data: {
                    bullet_key: 'b_0_1', //子弹唯一标识
                    wp_skin: 1, //发出该子弹时武器皮肤
                    wp_level: 950, //发出该子弹时武器等级
                    skill_ing: 1, //正在进行中的技能id
                    fish_keys: ['fj_0_0', 'fj_2_1'], //碰撞鱼key数组
                }
            },
            res: {}
        };


        /**
         * 机器人子弹碰撞鱼
         * @type {{route: string, msg: {enc: string, data: {bullet_key: string, wp_skin: number, wp_level: number, skill_ing: number, fish_keys: [string,string]}}, description: string}}
         */
        this._req.robot_catch_fish = {
            route: 'game.fishHandler.c_robot_catch_fish',
            msg: {
                enc: 'aes',
                data: {
                    robot_uid: 'fdsfdfsfsd',
                    bullet_key: 'b_0_1', //子弹唯一标识
                    wp_skin: 1, //发出该子弹时武器皮肤
                    wp_level: 950, //发出该子弹时武器等级
                    skill_ing: 1, //正在进行中的技能id
                    fish_keys: ['fj_0_0', 'fj_2_1'], //碰撞鱼key数组
                }
            },
            res: {}
        };

        /**
         * 使用技能
         * @type {{route: string, msg: {enc: string, data: {skill: number}}, res: {}}}
         */
        this._req.use_skill = {
            route: 'game.fishHandler.c_use_skill',
            msg: {
                enc: 'aes',
                data: {
                    skill: 1, //技能id
                }
            },
            res: {}
        };

        /**
         * 使用锁定技能锁定指定鱼
         * @type {{route: string, msg: {enc: string, data: {tfish: string}}, res: {}}}
         */
        this._req.use_skill_lock_fish = {
            route: 'game.fishHandler.c_use_skill_lock_fish',
            msg: {
                enc: 'aes',
                data: {
                    tfish: 'fj_0_0', //锁定鱼key
                }
            },
            res: {}
        };

        /**
         * 使用召唤技能召唤指定鱼
         * @type {{route: string, msg: {enc: string, data: {tfish: string, path: string}}, res: {}}}
         */
        this._req.use_skill_call_fish = {
            route: 'game.fishHandler.c_use_skill_call_fish',
            msg: {
                enc: 'aes',
                data: {
                    tfish: 'fj_0_0', //召唤鱼key
                    path: 'fj.json', //召唤鱼路径名
                }
            },
            res: {}
        };

        /**
         * 确定激光或核弹技能打击点
         * @type {{route: string, msg: {enc: string, data: {skill: number, fire_point: {x: number, y: number}}}, res: {}}}
         */
        this._req.use_skill_sure = {
            route: 'game.fishHandler.c_use_skill_sure',
            msg: {
                enc: 'aes',
                data: {
                    skill: 4, //技能id
                    fire_point: {
                        x: 100,
                        y: 200
                    }, //打击点
                }
            },
            res: {}
        };

        /**
         * 战斗行为通知
         * @t0武器皮肤更新 1武器倍率（武器升级、切换倍率）
         */
        this._req.fighting_notify = {
            route: 'game.fishHandler.c_fighting_notify',
            msg: {
                enc: 'aes',
                data: {
                    event: 0,
                    event_data: {},
                }
            },
            res: {}
        };

        /**
         * 子弹克隆：反弹或分裂
         */
        this._req.fire_clone = {
            route: 'game.fishHandler.c_fire_clone',
            msg: {
                enc: 'aes',
                data: {
                    src: '0-1-1', //克隆源
                    clones: [] //克隆的数组
                }
            },
            res: {}
        };
	
        /**
         * 房间内聊天
         */
        this._req.room_chat = {
            route: 'game.fishHandler.c_room_chat',
            msg: {
                enc: 'aes',
                data: {
                    seatId: 1,
                    type: 0, //0 文本 1图片 2语音
                    idx: 0, //模板索引,-1自定义内容
                    data: null, //对应类型的自定义内容,
                    matchFlag: 0, //0战斗同房间广播, 非0只在具体比赛选择中广播
                    tid:1001, //存在时为私聊信息，否则为房间内消息
                }
            },
            res: {}
        };

        /**
         * 世界弹幕
         * @type {{route: string, msg: {enc: string, data: {}}, res: {}}}
         */
        this._req.world_barrage ={
            route: 'game.fishHandler.c_world_barrage',
            msg: {
                enc: 'aes',
                data: {
                    type: 0, //0 文本 1图片 2语音
                    idx: 0, //模板索引,-1自定义内容
                    data: null, //对应类型的自定义内容,
                }
            },
            res: {}
        };

        /**
         * 破产领取
         */
        this._req.broke_reward = {
            route: 'game.fishHandler.c_broke_reward',
            msg: {
                enc: 'aes',
                data: {
                }
            },
            res: {}
        };

        /**
         * 保卫女神：通知服务器客户端已就绪
         */
        this._req.god_ready = {
            route: 'game.fishHandler.c_god_ready',
            msg: {
                enc: 'aes',
                data: {}
            },
            res: {}
        };

        /**
         * 保卫女神：暂停
         */
        this._req.god_pause = {
            route: 'game.fishHandler.c_god_pause',
            msg: {
                enc: 'aes',
                data: {}
            },
            res: {}
        };

        /**
         * 保卫女神：继续
         */
        this._req.god_continue = {
            route: 'game.fishHandler.c_god_continue',
            msg: {
                enc: 'aes',
                data: {}
            },
            res: {}
        };

        /**
         * 保卫女神：受伤
         */
        this._req.god_hurt = {
            route: 'game.fishHandler.c_god_hurt',
            msg: {
                enc: 'aes',
                data: {}
            },
            res: {}
        };

        /**
         * 保卫女神：跳关
         */
        this._req.god_jump = {
            route: 'game.fishHandler.c_god_jump',
            msg: {
                enc: 'aes',
                data: {}
            },
            res: {}
        };

        /**
         * 海盗任务：查询进度
         */
        this._req.query_pirate = {
            route: 'game.fishHandler.c_query_pirate',
            msg: {
                enc: 'aes',
                data: {}
            },
            res: {}
        };

        /**
         * 海盗任务：领取海盗任务奖励
         */
        this._req.pirate_reward = {
            route: 'game.fishHandler.c_pirate_reward',
            msg: {
                enc: 'aes',
                data: {
                    result: {},
                    players: [],
                }
            },
            res: {}
        };

        /**
         * 排位赛：继续比赛，例如中途退出或断线重连
         */
        this._req.continue_rmatch = {
            route: 'game.fishHandler.c_continue_rmatch',
            msg: {
                enc: 'aes',
                data: {
                    result: {},
                    players: [],
                }
            },
            res: {}
        };

         /**
         * 排位赛：抛媚眼
         */
        this._req.rmatch_provocative = {
            route: 'game.fishHandler.c_rmatch_provocative',
            msg: {
                enc: 'aes',
                data: {
                    result: {},
                }
            },
            res: {}
        };

        
        /**
         * 切换武器倍率
         */
        this._req.turn_weapon = {
            route: 'game.fishHandler.c_turn_weapon',
            msg: {
                enc: 'aes',
                data: {
                    result: {},
                }
            },
            res: {}
        };

        /**
         * 1v1对抗赛：继续比赛，例如中途退出或断线重连
         */
        this._req.continue_match_1v1 = {
            route: 'game.fishHandler.c_continue_match_1v1',
            msg: {
                enc: 'aes',
                data: {
                    result: {},
                    players: [],
                }
            },
            res: {}
        };

        /**
         * 1v1对抗赛：异步对战时查询对手开炮信息，供客户端模拟
         */
        this._req.query_1v1_record = {
            route: 'game.fishHandler.c_query_1v1_record',
            msg: {
                enc: 'aes',
                data: {
                    result: {},
                    players: [],
                }
            },
            res: {}
        };

    }

    initPush() {
        super.initPush();

        /**
         * 多人房广播他人进房间后，当前所有玩家信息
         * 数组，[Object, null, Object, Object] null标识该位置没有玩家
         * 单个玩家格式：{用户标识id, 座位号seatId, 武器wp_skin, 武器等级wp_level, 当前金币gold, 当前钻石pearl}
         * @type {{route: string, msg: {enc: string, data: {players: [null,null,null,null]}}}}
         */
        this._push.enter_room = {
            route: 's_enter_room',
            msg: {
                enc: 'aes',
                data: {
                    players: [{
                            id: 12312312,
                            seatId: 0,
                            wp_skin: 1,
                            wp_level: 120,
                            gold: 1000,
                            pearl: 10
                        },
                        {
                            id: 12312313,
                            seatId: 1,
                            wp_skin: 2,
                            wp_level: 10,
                            gold: 1000,
                            pearl: 10
                        },
                        {
                            id: 12312314,
                            seatId: 2,
                            wp_skin: 3,
                            wp_level: 100,
                            gold: 1000,
                            pearl: 10
                        },
                        {
                            id: 12312316,
                            seatId: 3,
                            wp_skin: 4,
                            wp_level: 1200,
                            gold: 1000,
                            pearl: 10
                        },
                    ]
                }
            },
            res: {}
        };

        /**
         * 多人房广播他人离开
         * @type {{route: string, msg: {enc: string, data: {seatId: number}}}}
         */
        this._push.leave_room = {
            route: 's_leave_room',
            msg: {
                enc: 'aes',
                data: {
                    seatId: 1, //离开者座位号
                }
            },
            res: {}
        };


        this._push.playerState = {
            route: 's_playerState',
            msg: {
                enc: 'aes',
                data: {
                    state: 0, //0：online, 1:offline
                    uid: 12022
                }
            },
            res: {}
        };


        /**
         * 多人房广播他人开炮
         * @type {{route: string, msg: {enc: string, data: {wp_skin: number, seatId: number, fire_point: {x: number, y: number}, gold: number}}}}
         */
        this._push.fire = {
            route: 's_fire',
            msg: {
                enc: 'aes',
                data: {
                    wp_skin: 1, //武器皮肤，决定子弹类型
                    seatId: 1, //开火人座位id
                    fire_point: {
                        x: 0,
                        y: 0
                    },
                    gold: 1000, //开伙人此时的金币数
                }
            },
            res: {}
        };

        /**
         * 多人房广播他人捕获鱼
         * @type {{route: string, msg: {enc: string, data: {seatId: number, catch_fishes: [string], gold: number, pearl: number}}, description: string}}
         */
        this._push.catch_fish = {
            route: 's_catch_fish',
            msg: {
                enc: 'aes',
                data: {
                    seatId: 1,
                    catch_fishes: ['fj_0_0'], //打死鱼唯一标识数组
                    gold: 12312, //本次碰撞打死鱼获得金币数量,即单次增量
                    pearl: 12 //本次打死鱼获得钻石数量，即单次增量
                }
            },
            res: {}
        };

        /**
         * 多人房广播他人使用技能
         * 有指定技能才返回，反之不返回对应字段
         * 注意，若技能是激光或核弹，需要则某玩家确认打击点后，才可广播给其他人
         * @type {{route: string, msg: {enc: string, data: {seatId: number, catch_fishes: [string], gold: number, pearl: number}}, res: {}}}
         */
        this._push.use_skill = {
            route: 's_use_skill',
            msg: {
                enc: 'aes',
                data: {
                    seatId: 1, //座位号

                    //锁定
                    skill_lock: {
                        tfish: 'fj_0_0' //默认锁定场景上最大鱼
                    },

                    //冰冻
                    skill_ice: {
                        left_seconds: 3, //离结束剩余时间，前者尚未结束，则后者接着使用即累加持续时间
                    },

                    //召唤
                    skill_call: {
                        fish_key: 'fj_0_0', //召唤鱼key
                    },

                    //核弹
                    skill_nb: {
                        nb_id: 8, //核弹id
                        fire_point: {
                            x: 100,
                            y: 900
                        }, //打击点
                    },

                    //激光
                    skill_laser: {
                        fire_point: {
                            x: 100,
                            y: 100
                        }, //打击点
                    }
                }
            },
            res: {}
        };

        /**
         * 多人房广播技能使用结束
         * @type {{route: string, msg: {enc: string, data: {seatId: number, skill: number}}, res: {}}}
         */
        this._push.use_skill_end = {
            route: 's_use_skill_end',
            msg: {
                enc: 'aes',
                data: {
                    seatId: 1, //座位号
                    skill: 1, //技能id
                }
            },
            res: {}
        };

        /**
         * 多人房广播刷鱼
         * @type {{route: string, msg: {enc: string, data: {evtName: string, evtData: {}}}, res: {}}}
         */
        this._push.flush_fish = {
            route: 's_flush_fish',
            msg: {
                enc: 'aes',
                data: {
                    evtName: 'EVENT_NEW_FISH', //刷鱼事件名
                    evtData: {}, //刷鱼数据
                }
            },
            res: {}
        };

        /**
         * 多人房广播战斗行为通知
         * @type {{route: string, msg: {enc: string, data: {evtName: string, evtData: {}}}, res: {}}}
         */
        this._push.fighting_notify = {
            route: 's_fighting_notify',
            msg: {
                enc: 'aes',
                data: {
                    seatId: 1, //座位号
                    event: 0,
                    event_data: {},
                }
            },
            res: {}
        };

        this._push.player_notify = {
            route: 's_player_notify',
            msg: {
                enc: 'aes',
                data: {
                    seatId: 1, //座位号
                    gold: 0,
                    pearl: 0,
                }
            },
            res: {}
        };

        this._push.room_chat = {
            route: 's_room_chat',
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

        this._push.god_ready = {
            route: 's_god_ready',
            msg: {
                enc: 'aes',
                data: {}
            },
            res: {}
        };

        this._push.god_pause = {
            route: 's_god_pause',
            msg: {
                enc: 'aes',
                data: {}
            },
            res: {}
        };

        this._push.god_continue = {
            route: 's_god_continue',
            msg: {
                enc: 'aes',
                data: {}
            },
            res: {}
        };

        this._push.god_hurt = {
            route: 's_god_hurt',
            msg: {
                enc: 'aes',
                data: {}
            },
            res: {}
        };

        this._push.god_jump = {
            route: 's_god_jump',
            msg: {
                enc: 'aes',
                data: {}
            },
            res: {}
        };

        this._push.turn_weapon = {
            route: 's_turn_weapon',
            msg: {
                enc: 'aes',
                data: {}
            },
            res: {}
        };

    }

    initRemote() {
        super.initRemote();
        this._rpc.enterGame = {
            route: 'rpc_enter_game',
            data: {
                mode: '',
                scene: 'scene_fish_1',
                sid: 'connector-server-1'
            }
        };

        this._rpc.leaveGame = {
            route: 'rpc_leave_game',
            data: {
                mode: '',
                scene: 'scene_fish_1',
                sid: 'connector-server-1'
            }
        };

        //玩家连接状态
        this._rpc.playerConnectState = {
            route: 'rpc_player_connect_state',
            data: {
                uid: 10011,
                state: 1,
                sid: 'connector-server-1',
                scene: 'scene_fish_1'
            }
        };

        //比赛正式开始
        this._rpc.matchStart = {
            route: 'rpc_match_start',
            data: {
                uid: 10011,
                roomId: '111111',
                sceneId: 'scene_fish_1'
            }
        };

        //比赛正常结束：开炮都结束或时间到
        this._rpc.matchFinish = {
            route: 'rpc_match_finish',
            data: {
                uid: 10011,
                roomId: '111111',
                sceneId: 'scene_fish_1'
            }
        };

        this._rpc.playerDataChange = {
            route: 'rpc_player_data_change',
            data: {
                uid: 10011
            }
        };
    }
}

module.exports = new FishCmd();