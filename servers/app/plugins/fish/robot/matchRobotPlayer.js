const Player = require('../entity/player');
const consts = require('../consts');
const uuidv1 = require('uuid/v1');
const redisAccountSync = require('../../../utils/redisAccountSync');
const B_MAX = 9999;

class RobotPlayer extends Player {
    constructor(opts) {
        super(opts);
    }

    //创建机器人
    static allocPlayer(data) {
        let uid = uuidv1();
        let player = new RobotPlayer({uid:uid, account: redisAccountSync.genAccount(uid,data.account),
            kindId: consts.ENTITY_TYPE.ROBOT, room:data.room});
            
        return player;
    }
}


module.exports = RobotPlayer;