/**
 * Created by Administrator on 2017/4/15.
 */

const omelo = require('omelo');

class PlayerFilter{
    constructor(){
    }

    before(msg, session, next){
        // logger.error('msg.__route__=', msg.__route__, msg)
        if(msg.__route__.indexOf('c_enter_room') == -1 && msg.__route__.indexOf('c_login') == -1 && msg.__route__.indexOf('c_logout') == -1){
            let room = omelo.app.game.hasInRoom(session.uid);
            if(!room){
                next(CONSTS.SYS_CODE.PALYER_NOT_IN_SCENE, {});
                return;
            }
            msg.room = room;
            next();
        }
        else{
            next();
        }
    }

    after(err, msg, session, resp, next){
        next();
    }

}

module.exports = new PlayerFilter();