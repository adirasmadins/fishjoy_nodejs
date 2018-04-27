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
    
    _addPlayerEvent(player) {
        super._addPlayerEvent(player);

        this._fishModel.setNextWaveFunc(function (waveCount) {
            player && player.nextWave(waveCount);
        });

        player.on(fishCmd.push.god_ready.route, function (event) {
            this._isPause = true;
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
            }
        }.bind(this));
        
        player.on(fishCmd.push.god_hurt.route, function (event) {
            let isGodDead = event.hpPercent === 0;
            this._fishModel.removeActorData(event.fishKey, isGodDead);
            if (isGodDead) {
                player.save();
                this._isGodDead = true;
                this._fishModel.pass(false, event.player.getCurGod().id, event.reward);
            }
            logger.debug('left count = ', this._fishModel.getActorTotal());
        }.bind(this));
    }
}

module.exports = GoddessRoom;