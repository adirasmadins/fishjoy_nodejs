/*
* date:2016/12/6
* author: huangxuequan
* function：奖励系统
*
*/

'use script';
const GAMECFG = require('../imports').DESIGN_CFG;
const REWARD_CFG = GAMECFG.daily_quest_cfg;
const daily_vitality_cfg = GAMECFG.daily_vitality_cfg;
const active_activequest_cfg = GAMECFG.active_activequest_cfg;
const active_active_cfg = GAMECFG.active_active_cfg;
const moment = require('moment');

const CompleteSign = -1;

const Specails = [
    {condition: 26, value1: 5000000, value2: 1, id: 1001},
    {condition: 27, value1: 27, value2: 1, id: 1002},
];

class RewardModel {
    constructor(account) {
        this.dailyTaskProcess = {}; //每日任务进度
        this.achieveTaskProcess = {}; //成就
        this.everyDay = [];              //日常任务数据
        this.achieve = [];               //成就数据
        this._achievePoint = null;       //成就点
        this._dailyTotalProcess = null;  //日常任务总的进度
        this._dailyBox = [];             //日常任务四个箱子
        this._receiveCallFunc = null;    //领取奖励的回调
        this.activeEveryDay = {};
        this.active = {};

        this.resetLoginData(account);
    }

    _isMultCondition(taskType) {
        switch (taskType) {
            case RewardModel.TaskType.CATCH_FISH:
                return true;
            case RewardModel.TaskType.USE_SKILL:
                return true;
            case RewardModel.TaskType.USE_FISH_CATCH_FISH:
                return true;
            case RewardModel.TaskType.GET_RANK_LV:
                return true;
            case RewardModel.TaskType.GET_DRAGON_STAR:
                return true;
            case RewardModel.TaskType.PLAY_LITTLE_GAME:
                return true;
            default:
                return false;
        }
    }

    _initTaskData() {
        for (let i = 0; i < REWARD_CFG.length; i++) {
            if (REWARD_CFG[i].type == RewardModel.Type.EVERYDAY) {
                this._initEveryDayData(REWARD_CFG[i].condition, i);
            } else {
                this._initAchieveData(REWARD_CFG[i].condition, i);
            }
        }

        for (let i in Specails) {
            let info = Specails[i];
            let obj = {};
            obj[info.value1] = 0;
            this.achieve[info.condition] = {keyProcess: obj};
        }
    }

    _initDailyTotalData() {
        this._dailyTotalProcess = this._getTaskProcess(RewardModel.Type.EVERYDAY, "dailyTotal");
        for (let i = 0; i < 4; i++) {
            let id = 'box' + i;
            this._dailyBox[i] = this._getTaskProcess(RewardModel.Type.EVERYDAY, id);
        }
    }

    _initAchievePoint() {
        this._achievePoint = this._getTaskProcess(RewardModel.Type.ACHIEVE, "achievePoint");
    }

    _resetAchieveProgress(mission_only_once) {
        mission_only_once && (this.achieveTaskProcess = mission_only_once);
    }

    _resetDailyProgress(mission_daily_reset) {
        mission_daily_reset && (this.dailyTaskProcess = mission_daily_reset);
    }

    _getTaskProcess(type, ID) {
        let process = null;
        if (type) {
            process = this.achieveTaskProcess;
        } else {
            process = this.dailyTaskProcess;
        }

        if (process[ID] == null) {
            process[ID] = 0;
        }
        return process[ID];
    }

    _initEveryDayData(TaskType, cfgIndex) {
        if (this.everyDay[TaskType] == null) {
            this.everyDay[TaskType] = new Object();
            this._initObject(this.everyDay[TaskType]);
        }
        this._setObjectData(this.everyDay[TaskType], cfgIndex);
    }

    _initAchieveData(TaskType, cfgIndex) {
        if (this.achieve[TaskType] == null) {
            this.achieve[TaskType] = new Object();
            this._initObject(this.achieve[TaskType]);
        }

        let process = this._getProcessByServerData(cfgIndex);
        if (process) {
            //  if(process <= cfg.value2){//表示还未领取
            this._setObjectData(this.achieve[TaskType], cfgIndex);
            //  }else{

            //  }
        } else {//表示还未进行
            this._setObjectData(this.achieve[TaskType], cfgIndex);
        }
    }

    _initObject(obj) {
        //说明
        //当 obj.keyProcess[key] > obj.MaxProcess[key]代表已经领取
        //当 obj.keyProcess[key] == obj.MaxProcess[key]代表可以领取
        //当 obj.keyProcess[key] < obj.MaxProcess[key]代表还在进行中
        obj.keyProcess = []; //当前进度
        obj.MaxProcess = []; //最大进度
        obj.cfgIndex = [];   //通过下标取档中的值 0-n eg：REWARD_CFG[ obj.cfgIndex[key] ]
    }

    _setObjectData(obj, cfgIndex) {
        let cfg = REWARD_CFG[cfgIndex];
        let process = this._getProcessByServerData(cfgIndex);
        if (obj.keyProcess[cfg.value1] == null || process) { //是0不需要缓存
            obj.keyProcess[cfg.value1] = process;
            obj.MaxProcess[cfg.value1] = cfg.value2; //最大进度
            obj.cfgIndex[cfg.value1] = cfgIndex;
        }
    }

    _getProcessByServerData(cfgIndex) {
        let cfg = REWARD_CFG[cfgIndex];

        let process = this._getTaskProcess(cfg.type, cfg.id);
        if (process != null) {
            return process;
        }
        return null;
    }

    _hasActive() {
        for (let idx in active_active_cfg) {
            let active = active_active_cfg[idx];
            let starttime = new Date(active.starttime);
            let endtime = new Date(active.endtime);
            if (moment().isBetween(starttime, endtime)) {
                return true;
            }
        }
        return false;
    }

    _addActiveEveryDayTask(taskType, num, key = 0) {
        let mark = false;
        let isChange = false;
        for (let i = 0; i < active_activequest_cfg.length; i++) {
            let activeActivequestCfg = active_activequest_cfg[i];
            if (activeActivequestCfg.condition == taskType && activeActivequestCfg.value1 == key
                && activeActivequestCfg.repeat == 1) {
                mark = true;
            }
        }
        if (!mark) return;
        if (num == null) {
            num = 1;
        }
        if (!this.activeEveryDay[taskType]) {
            this.activeEveryDay[taskType] = {};
        }
        if (!this.activeEveryDay[taskType][key]) {
            this.activeEveryDay[taskType][key] = num;
            isChange = true;
        } else if (this._isAssigement(taskType)) {
            if (this.activeEveryDay[taskType][key] < num) {
                this.activeEveryDay[taskType][key] = num;
                isChange = true;
            }
        } else {
            this.activeEveryDay[taskType][key] += num;
            isChange = true;
        }
        if (isChange) this.activeEveryDay.isChange = true;
    }

    _addEveryDayTask(taskType, num, key) {
        if (num == null) {
            num = 1;
        }
        if (!this._isMultCondition(taskType))
            key = 0;
        if (this.everyDay[taskType] == null || this.everyDay[taskType].keyProcess[key] == null || this.everyDay[taskType].keyProcess[key] < 0) {//目前任务不在统计范围内
            return;
        }
        let index = this.everyDay[taskType].cfgIndex[key];
        if (this.everyDay[taskType].keyProcess[key] < REWARD_CFG[index].value2) {
            if (this._isAssigement(taskType)) {
                if (this.everyDay[taskType].keyProcess[key] < num) {
                    this.everyDay[taskType].keyProcess[key] = num;
                }
            } else {
                this.everyDay[taskType].keyProcess[key] += num;
            }
            if (this.everyDay[taskType].keyProcess[key] > REWARD_CFG[index].value2) {
                this.everyDay[taskType].keyProcess[key] = REWARD_CFG[index].value2;
            }
            this.everyDay.isChange = true;
        }
    }

    _addActiveTask(taskType, num, key = 0) {
        let mark = false;
        let isChange = false;
        for (let i = 0; i < active_activequest_cfg.length; i++) {
            let activeActivequestCfg = active_activequest_cfg[i];
            if (activeActivequestCfg.condition == taskType && activeActivequestCfg.value1 == key
                && activeActivequestCfg.repeat == 0) {
                mark = true;
            }
        }
        if (!mark) return;
        if (num == null) {
            num = 1;
        }
        if (!this.active[taskType]) {
            this.active[taskType] = {};
        }
        if (!this.active[taskType][key]) {
            this.active[taskType][key] = num;
            isChange = true;
        } else if (this._isAssigement(taskType)) {
            if (this.active[taskType][key] < num) {
                this.active[taskType][key] = num;
                isChange = true;
            }
        } else {
            this.active[taskType][key] += num;
            isChange = true;
        }
        isChange && (this.active.isChange = true);
    }

    //TODO捕鱼 和 技能需要特殊处理
    _addAchieveTask(taskType, num, key) {
        if (num == null) {
            num = 1;
        }
        if (!this._isMultCondition(taskType))
            key = key || 0;
        if (this.achieve[taskType] == null || this.achieve[taskType].keyProcess[key] == null || this.achieve[taskType].keyProcess[key] < 0) {//目前任务不在统计范围内
            return;
        }
        if (this._isAssigement(taskType)) {
            if (this.achieve[taskType].keyProcess[key] < num) {
                this.achieve[taskType].keyProcess[key] = num;
            }
        } else {
            this.achieve[taskType].keyProcess[key] += num;
        }
        this.achieve.isChange = true;
    }

    _isAssigement(taskType) {
        switch (taskType) {
            case RewardModel.TaskType.UPDATE_USER_LV:
                return true;
            case RewardModel.TaskType.UPDATE_WEAPON_LV:
                return true;
            case RewardModel.TaskType.ONE_CATCH_FISH:
                return true;
            case RewardModel.TaskType.ONE_GET_GOLD:
                return true;
            case RewardModel.TaskType.GET_VIP_LV:
                return true;
            case RewardModel.TaskType.GODDESS_LEVEL:
                return true;
            case RewardModel.TaskType.PLAY_LITTLE_GAME:
                return true;
            case RewardModel.TaskType.GOLD_FIRST:
                return true;
            case RewardModel.TaskType.CHALLENGE_POS:
                return true;
            case RewardModel.TaskType.CHALLENGE_DUANWEI:
                return true;
            case RewardModel.TaskType.UNLOCK_GODDESS:
                return true;
            case RewardModel.TaskType.GET_ACHIEVE_POINT:
                return true;
            case RewardModel.TaskType.PETFISH_TOTAL_LEVEL:
                return true;
            case RewardModel.TaskType.GET_WEAPON_SKIN:
                return true;
            default:
                return false;
        }
    }

    _getReadyData2Send(type, isStrong = true) {
        let data = {};
        let obj = null;

        if (type == RewardModel.Type.EVERYDAY) {
            obj = this.everyDay;
        } else if (type == RewardModel.Type.ACHIEVE) {
            obj = this.achieve;

            for (let i in Specails) {
                const info = Specails[i];
                data[info.id] = obj[info.condition].keyProcess[info.value1];
            }
        }
        if (!isStrong && !obj.isChange) {
            return;
        }
        obj.isChange = false;

        for (let i in obj) {
            for (let key in obj[i].keyProcess) {
                if (obj[i].keyProcess[key] != null && obj[i].keyProcess[key] != 0 && obj[i].cfgIndex) {
                    let index = obj[i].cfgIndex[key];
                    let id = REWARD_CFG[index].id;
                    data[id] = obj[i].keyProcess[key];
                }
            }
        }

        if (type == RewardModel.Type.EVERYDAY) {
            data['dailyTotal'] = this._dailyTotalProcess;
            for (let i = 0; i < 4; i++) {
                let id = 'box' + i;
                data[id] = this._dailyBox[i];
            }
        } else if (type == RewardModel.Type.ACHIEVE) {
            data['achievePoint'] = this._achievePoint;
        }
        return data;
    }

    _getActiveData(type) {
        if (type == RewardModel.Type.ACTIVE) {
            if (this.active && this.active.isChange) {
                delete this.active.isChange;
                return this.active;
            }
        } else if (type == RewardModel.Type.ACTIVE_DAY) {
            if (this.activeEveryDay.isChange) {
                delete this.activeEveryDay.isChange;
                return this.activeEveryDay;
            }
        }
        return null;
    }

    /**
     * 依据account对应字段重置待统计字段
     * @param {*} account 
     */
    resetLoginData(account) {
        this._resetAchieveProgress(account.mission_only_once);
        this._resetDailyProgress(account.mission_daily_reset);
        this.everyDay = [];
        this.achieve = [];

        this._initTaskData();
        this._initDailyTotalData();
        this._initAchievePoint();

        this.activeEveryDay = account.active_daily_reset;
        this.active = account.active;
        if (!account.active) {
            logger.error('no active = ', account.id || account.uid);
        }

        this._account = account;
    }

    /**
     * 统计进度，未及时提交，同一作用域可多次调用
     * @param {*} taskType 
     * @param {*} num 
     * @param {*} key 
     */
    updateProcess(taskType, num, key) {
        this._addEveryDayTask(taskType, num, key);
        this._addAchieveTask(taskType, num, key);

        if (this._hasActive()) {
            this._addActiveEveryDayTask(taskType, num, key);
            this._addActiveTask(taskType, num, key);
        }
    }

    /**
     * 统计进度并提交，同一作用域不建议多次调用
     * @param {*} taskType 
     * @param {*} num 
     * @param {*} key 
     */
    addProcess(taskType, num, key) {
        this.updateProcess(taskType, num, key);
        this.commit();
    }

    /**
     * 重置并提交
     */
    commit () {
        this.ready2Commit();
        this._account.commit();
    }

    /**
     * 重置相关数据到account对应字段，待提交
     */
    ready2Commit () {
        let mission_only_once = this._getReadyData2Send(RewardModel.Type.ACHIEVE);
        let mission_daily_reset = this._getReadyData2Send(RewardModel.Type.EVERYDAY);
        mission_only_once && (this._account.mission_only_once = mission_only_once);
        mission_daily_reset && (this._account.mission_daily_reset = mission_daily_reset);
        
        if (this._hasActive()) {
            let active = this._getActiveData(RewardModel.Type.ACTIVE);
            let active_daily_reset = this._getActiveData(RewardModel.Type.ACTIVE_DAY);
            active && (this._account.active = active);
            active_daily_reset && (this._account.active_daily_reset = active_daily_reset);
        }
    }

}

RewardModel.Type = {
    EVERYDAY: 0,
    ACHIEVE: 1,
    REGISTER: 2,
    ACTIVE: 3,
    ACTIVE_DAY: 4
};

RewardModel.TaskType = {
    NONE: 0,
    CATCH_FISH: 1,          //捕获x鱼y条，如果x为0则为任意鱼
    USE_SKILL: 2,           //使用x技能y次，如果x为0则为任意技能
    UPDATE_USER_LV: 3,      //角色等级x级
    UPDATE_WEAPON_LV: 4,    //解锁炮台x倍
    USE_FISH_CATCH_FISH: 5, //利用x鱼炸死y条其他鱼
    GET_WEAPON_SKIN: 6,     //获得炮台皮肤x个
    ONE_CATCH_FISH: 7,      //单次开炮捕获鱼x条
    ONE_GET_GOLD: 8,        //单次开炮获得金币x
    GET_GOLD: 9,            //累计获得金币x
    USE_DIAMOND: 10,        //累计消耗钻石x
    USE_GOLD: 11,           //累计消耗金币x
    SHARE_TIMES: 12,        //分享x次
    CONTINUE_LOGIN: 13,     //累计登录x天
    GET_RANK_LV: 14,        //获得排位x阶段位y次
    GET_VIP_LV: 15,         //成为VIPx
    GET_DRAGON_STAR: 16,    //达成龙宫x星y次
    GET_ACHIEVE_POINT: 17,  //获得x点成就点
    GOLD_TIMES: 18, //金币次数
    CHARG_PEARL: 19, //充值珍珠
    DEFEND_GODDESS: 20, //保卫女神
    STOCKING_FISH: 21, //放养鱼
    GODDESS_LEVEL: 22, //女神最高闯关
    PETFISH_TOTAL_LEVEL: 23, //宠物鱼等级和
    UNLOCK_GODDESS: 24, //解锁女神
    PLAY_LITTLE_GAME: 25, //x小游戏中获得y分
    GOLD_FIRST: 26, //成为首富y次
    CHALLENGE_POS: 27, //排位赛段位y
    CHALLENGE_WIN: 28, //排位赛获得x次胜利
    CHALLENGE_DUANWEI: 29, //排位赛段位大于等于x
    MAX: 30,//最后一个，暂时取消掉了
};

module.exports = RewardModel;
