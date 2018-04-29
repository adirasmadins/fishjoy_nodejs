const GAMECFG = require('../imports').DESIGN_CFG;
const REWARD_CFG = GAMECFG.daily_quest_cfg;
const daily_vitality_cfg = GAMECFG.daily_vitality_cfg;
const active_activequest_cfg = GAMECFG.active_activequest_cfg;
const active_active_cfg = GAMECFG.active_active_cfg;
const moment = require('moment');
const constDef = require('../../../app/consts/constDef');

class MissionModel{
    constructor(account){
        this._account = account;
        this._activeCfg;
        this._update = {};  // key:{id:value}  key===> type-condition-value1
        this._update[MissionModel.Type.EVERYDAY] = {};
        this._update[MissionModel.Type.ACTIVE_DAY] = {};
        this._update[MissionModel.Type.ACTIVE] = {};
        this._update[MissionModel.Type.REGISTER] = {};
        this._update[MissionModel.Type.ACHIEVE] = {};
    }

    updateProcess(taskType, num, key) {
        this._addEveryDayTask(taskType, num, key);
        this._addAchieveTask(taskType, num, key);

        if (this._hasActive()) {
            this._addActiveEveryDayTask(taskType, num, key);
            this._addActiveTask(taskType, num, key);
        }
    }

    _hasActive() {
        for (let idx in active_active_cfg) {
            let active = active_active_cfg[idx];
            let starttime = new Date(active.starttime);
            let endtime = new Date(active.endtime);
            if (moment().isBetween(starttime, endtime)) {
                this._activeCfg = active;
                return true;
            }
        }
        return false;
    }

    _isMultCondition(taskType) {
        switch (taskType) {
            case constDef.TaskType.CATCH_FISH:
            case constDef.TaskType.USE_SKILL:
            case constDef.TaskType.USE_FISH_CATCH_FISH:
            case constDef.TaskType.GET_RANK_LV:
            case constDef.TaskType.GET_DRAGON_STAR:
            case constDef.TaskType.PLAY_LITTLE_GAME:
                return true;
            default:
                return false;
        }
    }

    _addEveryDayTask(taskType, num, key) {
        let newVar = this._update[MissionModel.Type.EVERYDAY][key] || 0;


    }
    _addAchieveTask(taskType, num, key) {}
    _addActiveEveryDayTask(taskType, num, key) {}
    _addActiveTask(taskType, num, key) {}


}

MissionModel.Type = {
    EVERYDAY: 0,
    ACHIEVE: 1,
    REGISTER: 2,
    ACTIVE: 3,
    ACTIVE_DAY: 4
};

module.exports = MissionModel;