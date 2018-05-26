const FishPlayer = require('./player');
const globalStatusData = require('../../../utils/globalStatusData');
const ERROR_OBJ = require('../../../consts/fish_error').ERROR_OBJ;
const constDef = require('../../../consts/constDef');
const rankMatchCmd = require('../../../cmd/rankMatchCmd');
const rpcSender = require('../../../net/rpcSender');
const configReader = require('../../../utils/configReader');
const fishCmd = require('../../../cmd/fishCmd');
const consts = require('../consts');
const RmatchHelper = require('./rmatchHelper');
const FishCode = CONSTS.SYS_CODE;

class MatchPlayer extends FishPlayer {
    constructor(opts) {
        super(opts);
        this._rmHelper = null;
        logger.error('==========MatchPlayer=====');
    }

    static sBaseField() {
        return FishPlayer.sBaseField();
    }

    getBaseField() {
        return MatchPlayer.sBaseField();
    }

    static attach(instObj){
        logger.error('玩家附加比赛属性=', instObj.uid);
        let prototypeNames = Object.getOwnPropertyNames(MatchPlayer.prototype);
        for(let i in prototypeNames) {
            let key = prototypeNames[i];
            if(key != 'constructor'){
                instObj[key] = MatchPlayer.prototype[key];
            }
        }
    }

    static dettach(instObj, prototypeObj){
        logger.error('玩家移除比赛属性=', instObj.uid);
        let prototypeNames = Object.getOwnPropertyNames(MatchPlayer.prototype);
        for(let i in prototypeNames) {
            let key = prototypeNames[i];
            if(key != 'constructor'){
                delete instObj[key];
            }
        }

        let prototypeNames1 = Object.getOwnPropertyNames(prototypeObj);
        for(let i in prototypeNames1) {
            let key = prototypeNames1[i];
            if(key != 'constructor' && typeof prototypeObj[key] == 'function'){
                instObj[key] = prototypeObj[key];
            }
        }
    }

    /**
     * 战斗服向比赛服发送数据
     * @param {*} method
     * @param {*} data
     * @param {*} cb
     */
    async matchEventCall(method, data) {
        data = data || {};
        data.uid = this._account.id;
        data.roomId = this._rmHelper.roomId;
        return await rpcSender.invoke(rpcSender.serverType.rankMatch, rpcSender.serverModule.rankMatch.rankMatchRemote, method, data, this._rmHelper.rankMatchSid);
    }

    //打鱼分数计
    _catch_fish_count(bks, ret){
        return this._rmHelper.fireCount(bks, ret, this.fishModel);
    }

    /**
     * 战斗行为通知
     * 注意，只是变更通知，并不需持久化
     */
    c_fighting_notify(data, cb) {
        logger.error('排位赛战斗行为通知');
        let event = data.event;
        let evtData = data.event_data;
        if (event == consts.FIGHTING_NOTIFY.RMATCH_NB) {
            logger.error('排位赛核弹使用统计');
            let rmatch_nb = evtData.rmatch_nb;
            if (!rmatch_nb) {
                this._rmHelper.nbFlag(false);
                this.matchEventCall(rankMatchCmd.remote.cancelNbomb.route);
                this.stopMatch();
            }
        }
        super.c_fighting_notify(data, cb);
    }

    /**
     * 战斗内聊天
     */
    c_room_chat(data, cb) {
        logger.error('排位赛战战斗内聊天');
        let tdata = {
            type: data.type,
            idx: data.idx,
            matchFlag: data.matchFlag,
        };
        this.matchEventCall(rankMatchCmd.remote.rmatchChat.route, tdata);
        utils.invokeCallback(cb, null, {
            state: 1,
        });
    }

    /**
     * 排位赛：抛媚眼
     */
    c_rmatch_provocative(data, cb) {
        let score = this._rmHelper.provocativeAnother();
        let ret = {
            provocativeVal: score
        }
        this.matchEventCall(rankMatchCmd.remote.provocative.route, ret);
        utils.invokeCallback(cb, null, ret);
    }
    
    /**
     * 切换武器倍率
     */
    c_turn_weapon(data, cb) {
        logger.error('排位赛战武器切换');
        let {err, newWp} = this._turn_new_weapon_level(data.up);
        if (err) {
            return utils.invokeCallback(cb, err);
        }

        let rmMinLevel = configReader.getValue('common_const_cfg', 'RMATCH_OPEN_LIMIT');
        if (newWp < rmMinLevel) {
            return utils.invokeCallback(cb, ERROR_OBJ.RM_WEAPON_LEVEL_LIMIT);
        }

        this._curWeapon = newWp;
        utils.invokeCallback(cb, null, {
            wp_level: newWp,
        });
        this._notify_weapon_level(newWp);
    }

    //排位赛时，皮肤变化需要及时通知
    _weapon_skin_change(wpSkin){
        this.matchEventCall(rankMatchCmd.remote.weaponChange.route, {
            uid: this.uid,
            wp_skin: wpSkin,
        });
    }

    /**
     * 排位赛：继续比赛，例如中途退出或断线重连
     */
    async continueMatch(data, cb) {
        logger.error('排位赛继续比赛');
        try {
            let rankMatchPos = await globalStatusData.queryData(constDef.GLOBAL_STATUS_DATA_TYPE.PLAYER_RANKMATCH_POS, rpcSender.serverType.rankMatch, this.uid);
            if (!rankMatchPos) {
                throw ERROR_OBJ.MATCH_ROOM_GAMEOVER;
            } else {
                if (Date.now() - Number(rankMatchPos.time) >= constDef.MATCH.MSECONDS) {
                    await globalStatusData.delData(constDef.GLOBAL_STATUS_DATA_TYPE.PLAYER_RANKMATCH_POS, this.uid, rankMatchPos.serverId);
                    throw ERROR_OBJ.MATCH_ROOM_GAMEOVER;
                }
            }

            logger.error('rankMatchPos=', rankMatchPos);
            this._generateRmHelper({serverId: rankMatchPos.serverId, roomId: rankMatchPos.roomId});

            let matchInfo = await this.matchEventCall(rankMatchCmd.remote.query_playerInfo.route);
            if (!matchInfo) {
                throw ERROR_OBJ.MATCH_ROOM_GAMEOVER;
            }

            let playersInfos = matchInfo.players;
            for (let i = 0; i < playersInfos.length; i++) {
                let p = playersInfos[i];
                if (p.uid == this.uid) {
                    this._rmHelper.resetWithContinue(p.status.fire, p.status.score);
                    this.startMatch({
                        nbomb_cost: p.nbomb_cost,
                        serverId: data.serverId,
                        roomId: data.roomId,
                    });
                    break;
                }
            }
            utils.invokeCallback(cb, null, {
                players: playersInfos,
                countdown: matchInfo.countdown
            });
            logger.error('继续比赛信息=', {
                players: playersInfos,
                countdown: matchInfo.countdown
            });

        } catch (e) {
            logger.error('c_continue_rmatch 继续比赛失败', e);
            //排位赛结束
            this.stopMatch();
            utils.invokeCallback(cb, null, {});
        }
    }

    /**
     * 排位赛：正式开始
     */
    startMatch(evtData) {
        logger.error('比赛开始 startMatch');
        this._generateRmHelper(evtData || {});
        this._rmHelper.setNbCost(evtData.nbomb_cost);
        this._rmHelper.registerUpdateFunc(function (data) {
            logger.error('当前战绩===', data);
            if (data.nbomb) {
                this.matchEventCall(rankMatchCmd.remote.useNbomb.route, data);
                this.stopMatch();
            } else {
                //比赛结算时，注意皮肤星级加成
                if (this._rmHelper.isNormalFireEnd()) {
                    let curSkin = this._curSkin;
                    let star = this.getSkinStar(curSkin);
                    let wpStarCfg = null;
                    star && (wpStarCfg = configReader.getWeaponStarData(curSkin, star));
                    if (wpStarCfg) {
                        data.star = {
                            skin: curSkin,
                            score: wpStarCfg.score,    //--比赛分数提高
                            rank: wpStarCfg.rank,    //--比赛胜点提高
                        };
                    }
                }
                this.matchEventCall(rankMatchCmd.remote.fightInfo.route, data);
            }
        }.bind(this));
    }

    /**
     * 排位赛：全程结束，销毁
     */
    stopMatch() {
        this._rmHelper && this.emit(fishCmd.push.fighting_notify.route, {
            player: this,
            data: {
                seatId: this.seatId,
                event: consts.FIGHTING_NOTIFY.RMATCH_STATE,
                event_data: {
                    rmatch_state: 1
                },
            }
        });
        this._rmHelper = null;
        if(this.prototypeObj){
            MatchPlayer.dettach(this, this.prototypeObj);
            delete this.prototypeObj;
        }

        logger.info('比赛结束，重置状态');
    }

    _generateRmHelper(data) {
        if (!this._rmHelper) {
            logger.error('创建rmHelper');
            this._rmHelper = new RmatchHelper();
            this._rmHelper.setServerData({
                serverId: data.serverId,
                roomId: data.roomId,
            });

            this.emit(fishCmd.push.fighting_notify.route, {
                player: this,
                data: {
                    seatId: this.seatId,
                    event: consts.FIGHTING_NOTIFY.RMATCH_STATE,
                    event_data: {
                        rmatch_state: 0
                    },
                }
            });
        }
    }

    _check_nbombCost_enough(skillId, wp_level) {
        if (!this._rmHelper.isNormalFireEnd()) {
            return {resp: {rmatch: true}};
        } else {
            if (this._cost.checkRmatchWithCost(this._account, this._rmHelper.nbombCost) > 0) {
                logger.error('--非法调用', this._rmHelper.nbombCost)
                return {err: FishCode.INVALID_SKILL};
            }
        }
        return {};
    }

    // 扣除核弹消耗
    _deduct_nbombCost(data) {
        let ret = null;
        let skillId = data.skill;

        if (this._rmHelper.isNormalFireEnd()) {
            let nbCost = this._rmHelper.nbombCost;
            if (nbCost > 0) {
                ret = this._cost.useSkillWithRmatch(skillId, data.wp_level, this, nbCost);
                this._rmHelper.nbFlag(true);
            } else {
                this._rmHelper.nbFlag(false);
        
                logger.error('sdfsd----取消核弹', nbCost)
            }
        }
        return ret;
    }

    //海盗任务统计(排位赛进行中不统计)
    _pirate_mission(data, fishID){}
}

module.exports = MatchPlayer;