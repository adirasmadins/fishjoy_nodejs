const ChannelPlayer =  require('./channelPlayer');
const GoddessPlayer = require('../goddess/goddessPlayer');
const RankMatchPlayer = require('../rankMatch/rankMatchPlayer');

const redisAccountSync = require('../../../utils/redisAccountSync');
const consts = require('../consts');

class PlayerFactory{
    constructor(){
    }

    _allocPlayer(data, classObj){
        let promise = new Promise((resolve, reject)=>{
            let baseField = classObj.sBaseField();
            //logger.error('account data.uid= ', data.uid, baseField);
            redisAccountSync.getAccount(data.uid, baseField, function (err, account) {
                if(err){
                    reject(CONSTS.SYS_CODE.DB_INNER_ERROR);
                    return;
                }
                if(!account){
                    logger.error('2212312  account data.uid= ', data.uid, baseField);
                    reject(CONSTS.SYS_CODE.PLAYER_NOT_EXIST);
                    return;
                }

                //logger.error('account = ', account);
                let player = new classObj({
                    uid: data.uid, 
                    sid: data.sid, 
                    account: account,
                    kindId: consts.ENTITY_TYPE.PLAYER,
                });
                resolve(player);
            });
        });
        return promise;
    }

    /**
     * 创建一个真实玩家
     * @param {*} data 
     */
    async createPlayer(data){
        let classObj = this.getPlayerClass(data.roomType);
        if (!classObj) {
            return null;
        }
        return await this._allocPlayer(data, classObj);
    }

    getPlayerClass (mode) {
        switch (mode) {
            case consts.ROOM_TYPE.GODDESS:
                return GoddessPlayer;
            case consts.ROOM_TYPE.SINGLE:
            case consts.ROOM_TYPE.MULTI_FREE:
                return ChannelPlayer;
            case consts.ROOM_TYPE.RANK_MATCH:
                return RankMatchPlayer;
            default:
            break;
        }
        return null;
    }
}

module.exports = new PlayerFactory();