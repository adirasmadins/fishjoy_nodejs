const RobotPlayer = require('./robotPlayer');
const fishCmd = require('../../../cmd/fishCmd');
const omelo = require('omelo');
const config = require('../config');
const robotBuilder = require('./robotBuilder');
const consts = require('../consts');

class RobotController {
    constructor(robotEvent) {
        this._robotPlayerMap = new Map();
        this._fireTimer = null;
        robotEvent.on(fishCmd.request.robot_catch_fish.route.split('.')[2], this.onCatchfish.bind(this));
        logger.error('-----------------RobotController'); 
    }

    run() {
        
        //关闭机器人
        if (!this._fireTimer) {
            this._fireTimer = setInterval(this.robotAction.bind(this), config.ROBOT.FIRE_TIMEOUT);
        }
    }

    stop() {
        if (this._fireTimer) {
            clearInterval(this._fireTimer);
        }
    }

    robotAction() {
        this.fire();
        this._checkTimeout();
    }

    onCatchfish(data, cb) {
        let player = this._robotPlayerMap.get(data.robot_uid);
        if (player) {
            player.c_catch_fish(data, cb);
        }
        else {
            utils.invokeCallback(cb, CONSTS.SYS_CODE.ROBOT_NOT_EXIST);
        }
    }


    /**
     * 添加机器人到房间
     * @param rooms
     */
    async addRobot(rooms) {
        if (rooms.length == 0) {
            return;
        }

        for(let room of rooms){
            if (!room.isRobotJoinEnabled()) {
                continue;
            }

            let account = await robotBuilder.genAccount(room);
            let player = RobotPlayer.allocPlayer({
                sceneId: room.sceneId,
                account: account,
                room:room
            });

            logger.error('机器人加入房间：');
            this._addPlayerEvent(player);
            this._robotPlayerMap.set(player.uid, player);

            room.join(player);
        }
    }

    _checkTimeout(){
        let now = Date.now();
        let uids = [];
        let rVal = Math.floor(Math.random()*300) * 1000 + config.ROBOT.JOIN_TIMEOUT;
        for(let player of this._robotPlayerMap.values()){
            if(now - player.joinTime >= rVal){
                player.room.leave(player.uid);
                uids.push(player.uid);
                // logger.error('------------------------玩家超时离开', player.uid);
            }
        }

        uids.forEach(function (uid) {
            this._robotPlayerMap.delete(uid);
        }.bind(this));
    }

    _addPlayerEvent(player) {
        player.on('kick', function (event) {
            this._robotPlayerMap.delete(event.player.uid);

        }.bind(this));
    }

    /**
     * 开火
     */
    fire() {
        for (let player of this._robotPlayerMap.values()) {
            player.robotFire();
        }
    }

     useSkill() {
        for(let player of this._robotPlayerMap.values()){
            let wpLv = player.DIY.weapon;
            let skillId = 8;
            player.c_use_skill({
                skill: skillId,
                wp_level: wpLv, 
            }, function () {
                player.c_use_skill_sure({
                    skill: skillId,
                    fire_point: {x: utils.random_int(0, 1280), y: utils.random_int(0,720)}, //开火人打击点
                    wp_level: wpLv,
                });
            });
        }
    }

    changeWeapon() {
        for(let player of this._robotPlayerMap.values()){
            let eng = player.DIY.weapon_energy;
            let keys = Object.keys(eng);
            let ri = Math.floor(Math.random()*keys.length);
            let wpLv = keys[ri];
            if (player.DIY.weapon == wpLv) {
                continue;
            }
            player.c_fighting_notify({
                event: consts.FIGHTING_NOTIFY.WP_LEVEL,
                event_data: wpLv,  
            });
        }
    }

    changeWeaponSkin() {
        for(let player of this._robotPlayerMap.values()){
            let own = player.account.weapon_skin.own;
            let ri = Math.floor(Math.random()*own.length);
            let wpSkin = own[ri];
            if (player.DIY.weapon_skin == wpSkin) {
                continue;
            }
            player.c_fighting_notify({
                event: consts.FIGHTING_NOTIFY.WP_SKIN,
                event_data: wpSkin,  
            });
        }
    }


}

module.exports = RobotController;


