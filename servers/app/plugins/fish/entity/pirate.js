// //--[[
// description: 海盗任务
// author: scott (liuwenming@chufengnet.com)
// date: 20171129
// ATTENTION：
// //--]]
const configReader= require('../../../utils/configReader');

class Pirate {
    constructor (record, pirateIds) {
        this.reset();
        this._resetMission(record, pirateIds);
    }

    _setProgressnWithId (id, condition1, condition2) {
        let cfg = configReader.getValue('daily_pirate_cfg', id);
        if (cfg && cfg.condition1.length === 2 && cfg.condition2.length === 2) {
            let f1 = cfg.condition1[0];
            let f2 = cfg.condition2[0];
            this._progress[f1] = condition1;
            this._progress[f2] = condition2;
             this._total[f1] = cfg.condition1[1];
             this._total[f2]= cfg.condition2[1];
             this._id = id;
             this._fk1 = f1;
             this._fk2 = f2;
        }
    }

    _resetMission (record, pirateIds) {
        if (!record || !Object.keys(record).length) {
            //随机产生海盗任务id
            let idx = Math.floor(Math.random() * pirateIds.length);
            let id = pirateIds[idx];
            this._setProgressnWithId(id, 0, 0);
            return;
        }
        this._setProgressnWithId(record.pirate_task_id, record.condition1, record.condition2);
    }

    countFish (fishName) {
        let isChange = false;
        for (let k in this._progress) {
            if (k === fishName && this._progress[k] < this._total[k]) {
                this._progress[k] ++;
                isChange = true;
                break;
            }
        }
        if (this.isFinished()) {
            return 2;
        }else if (isChange) {
            return 1;
        }
        return 0;
    }

    isFinished () {
        let done = 0;
        for (let k in this._progress) {
            if (this._progress[k] >= this._total[k]) {
                done ++;
            }
        }
        return done === Object.keys(this._progress).length;
    }

    getProgress () {
        if (!this._id && !this._fk1 && !this._fk2) {
            return null;
        }
        let data = {
            pirate_task_id: this._id,
            condition1: this._progress[this._fk1],
            condition2: this._progress[this._fk2],
        };
        return data;
    }

    reset () {
        this._progress = {};
        this._total = {};
        this._id = 0;
        this._fk1 = null;
        this._fk2 = null;
    }
}

module.exports = Pirate;