const moment = require('moment');
const config = require('../config');

class MatchStore {
    constructor(opts) {
        this._matchId = null;
        this._isRealtime = false;
        this._isInviter = false;
        this._matchInfo = {
            createTime: null, //
            inviter: {//邀请人
                uid: -1,
                state: config.ARENA.MATCH_STATE.CREATED,
                score: 0,
            },
            invitee: {//被邀请人
                uid: -1,
                state: config.ARENA.MATCH_STATE.CREATED,
                score: 0,
            },
            state: config.ARENA.MATCH_STATE.CREATED,
            pkInfo: [],
        };
    }

    set isRealtime(is){
        this._isRealtime = is;
    }

    create(matchId, uid) {
        this._isInviter = true;
        this._matchId = matchId;
        this._matchInfo.inviter.uid = uid;
        this._matchInfo.createTime = moment().format('YYYY-MM-DD HH:mm:ss');
    }

    load(matchId, uid){
        this._isInviter = false;
        this._matchId = matchId;
        this._matchInfo.invitee.uid = uid;
        //TODO 加载比赛
    }

    //加载邀请人PK信息供客户端模拟开火
    loadPKInfo(){
    }

    recordPKInfo(info){
        this._matchInfo.info.push(info);
        if(!this._isRealtime && this._isInviter){
            //TODO 同步PKInfo，供异步模式被邀请人挑战比赛
        }
    }

    setMatchState(state){
        if(this._isInviter){
            this._matchInfo.inviter.state = state;
        }else {
            this._matchInfo.invitee.state = state;
        }

        // TODO 同步比赛状态
    }

    //TODO 比赛结束
    matchFinish(){

    }

}

module.exports = MatchStore;

