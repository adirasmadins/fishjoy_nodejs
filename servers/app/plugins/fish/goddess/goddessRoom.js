// //--[[
// description: 保卫女神房间
// author: scott (liuwenming@chufengnet.com)
// date: 20171129
// ATTENTION：
// //--]]
const FishRoom = require('../fishRoom');
const GoddessFishModel = require('./goddessFishModel');
const fishCmd = require('../../../cmd/fishCmd');

class GoddessRoom extends FishRoom {
    constructor (opts){
        super(opts);
        this._isPause = true;
        this._isStarted = false;
        this._isGodDead = false;
    }

    isNewFishEnabled () {
        if (this._isGodDead || this._isPause || !this._isStarted) {
            return false;
        }
        return super.isNewFishEnabled();
    }

    createFishModel () {
        let fishModel = new GoddessFishModel(this._evtor, this._sceneId);
        this._fishModel = fishModel;
    }
    
    /**
     * 重新开始
     */
    _replayAgain() {
        this._isPause = true;
        //注意：保卫女神无需保留离线前的数据， 即重新开始，清除之前已有的数据
        this._isStarted = false;
        this._fishModel.resetAll();
    }

    _addPlayerEvent(player) {
        super._addPlayerEvent(player);

        let isJumping = false;
        this._fishModel.setNextWaveFunc(function (waveCount) {
            player && player.nextWave(waveCount);
        });

        player.on(fishCmd.push.god_ready.route, function (event) {
            this._replayAgain();
        }.bind(this));

        player.on(fishCmd.push.god_pause.route, function (event) {
            this._isPause = true;
        }.bind(this));

        player.on(fishCmd.push.god_continue.route, function (event) {
            this._isPause = false;
            if (!this._isStarted) {
                this._isStarted = true;
                this._fishModel.setStart(event.player.godStart());
                this._fishModel._ready2StartNextWave(true);
                isJumping = false;
            }
        }.bind(this));
        
        player.on(fishCmd.push.god_hurt.route, function (event) {
            if (isJumping) {
                logger.error('正在跳关，无需处理，鱼已清空!');
                return;
            }
            let isGodDead = event.hpPercent === 0;
            this._fishModel.removeActorData(event.fishKey, isGodDead);
            if (isGodDead) {
                player.save();
                this._isGodDead = true;
                this._fishModel.pass(false, event.player.getCurGod().id, event.reward);
            }
            logger.debug('left count = ', this._fishModel.getActorTotal());
        }.bind(this));

        player.on(fishCmd.push.god_jump.route, function (event) {
            this._replayAgain();
            isJumping = true;
        }.bind(this));
    }
}

module.exports = GoddessRoom;