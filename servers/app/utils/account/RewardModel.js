const moment = require('moment');
const redisAccountSync = require('../../utils/redisAccountSync');
const DESIGN_CFG = require('../imports').DESIGN_CFG;
const active_activequest_cfg = DESIGN_CFG.active_activequest_cfg;
const active_active_cfg = DESIGN_CFG.active_active_cfg;
const active_newbie_cfg = DESIGN_CFG.active_newbie_cfg;
const daily_quest_cfg = DESIGN_CFG.daily_quest_cfg;

const TASK_PREFIX = {
    MISSION_TASK_ONCE: 'mission_task_once',
    MISSION_TASK_DAILY: 'mission_task_daily',
    ACTIVE_TASK_ONCE: 'active_task_once',
    ACTIVE_TASK_DAILY: 'active_task_daily',
};

const TASK_MAIN_TYPE = {
    DAILY: 0,
    ONCE: 1
};

function getTaskKey(prefix, mainType, taskType, subTaskType) {
    return `${prefix}:${mainType}_${taskType}_${subTaskType}`;
}

function getMissionPrefix(type) {
    return type == TASK_MAIN_TYPE.DAILY ? TASK_PREFIX.MISSION_TASK_DAILY : TASK_PREFIX.MISSION_TASK_ONCE;
}

function getActivePrefix(type) {
    return type == TASK_MAIN_TYPE.DAILY ? TASK_PREFIX.ACTIVE_TASK_DAILY : TASK_PREFIX.ACTIVE_TASK_ONCE;
}

//支持的任务类型
const supportTaskMap = {};
for (let i = 0; i < daily_quest_cfg.length; i++) {
    let item = daily_quest_cfg[i];
    supportTaskMap[getTaskKey(getMissionPrefix(item.type), item.type, item.condition, item.value1)] = true;
}

for (let i = 0; i < active_newbie_cfg.length; i++) {
    let item = active_newbie_cfg[i];
    supportTaskMap[getTaskKey(getMissionPrefix(1), 1, item.condition, item.value1)] = true;
}

for (let i = 0; i < active_activequest_cfg.length; i++) {
    let item = active_activequest_cfg[i];
    supportTaskMap[getTaskKey(getActivePrefix(item.repeat), item.repeat, item.condition, item.value1)] = true;
}

const EXPORT_TOOLS = {
    TASK_PREFIX: TASK_PREFIX,
    TASK_MAIN_TYPE: TASK_MAIN_TYPE,
    getTaskKey: getTaskKey
};

class MissionModel {
    constructor(account) {
        this._uid = account.id;
        this._taskProcessMap = {};
        //判断是否统计
        this._ignoreTaskMap = {};
        this._loadIgnoreTask(account);
    }

    //存入不需要更新的任务,如果是第一次（或者进度为空）进行设置
    _loadIgnoreTask(account) {
        let missionDailyReset = account.mission_daily_reset;
        let missionOnlyOnce = account.mission_only_once;
        let daily_quest_cfg_len = daily_quest_cfg.length;
        for (let i = 0; i < daily_quest_cfg_len; i++) {
            let dailyQuestCfg = daily_quest_cfg[i];
            if (dailyQuestCfg.type === TASK_MAIN_TYPE.DAILY) {
                let missionDailyReset2 = missionDailyReset[dailyQuestCfg.id];
                if (missionDailyReset2 != null) {
                    if (missionDailyReset2 == -1) {
                        this._ignoreTaskMap[getTaskKey(TASK_PREFIX.MISSION_TASK_DAILY, dailyQuestCfg.type, dailyQuestCfg.condition, dailyQuestCfg.value1)] = true;
                    }
                }
            } else if (dailyQuestCfg.type === TASK_MAIN_TYPE.ONCE) {
                let missionOnlyOnce2 = missionOnlyOnce[dailyQuestCfg.id];
                if (missionOnlyOnce2 != null) {
                    if (missionOnlyOnce2 == -1) {
                        this._ignoreTaskMap[getTaskKey(TASK_PREFIX.MISSION_TASK_ONCE, dailyQuestCfg.type, dailyQuestCfg.condition, dailyQuestCfg.value1)] = true;
                    }
                }
            }
        }

        let active_daily_reset = account.active_daily_reset;
        let active = account.active;
        for (let i = 0; i < active_activequest_cfg.length; i++) {
            let activeQuestCfg = active_activequest_cfg[i];
            if (activeQuestCfg.repeat === TASK_MAIN_TYPE.DAILY) {
                let activeDailyValue = active_daily_reset[activeQuestCfg.condition];
                if (activeDailyValue && activeDailyValue[activeQuestCfg.value1] == -1) {
                    this._ignoreTaskMap[getTaskKey(TASK_PREFIX.ACTIVE_TASK_DAILY, activeQuestCfg.type, activeQuestCfg.condition, activeQuestCfg.value1)] = true;
                }
            } else if (activeQuestCfg.repeat === TASK_MAIN_TYPE.ONCE) {
                let activeValue = active[activeQuestCfg.condition];
                if (activeValue && activeValue[activeQuestCfg.value1] == -1) {
                    this._ignoreTaskMap[getTaskKey(TASK_PREFIX.ACTIVE_TASK_ONCE, activeQuestCfg.type, activeQuestCfg.condition, activeQuestCfg.value1)] = true;
                }
            }
        }
    }

    //获取一次性任务进度数据
    static async syncMissionTaskOnce(uid) {
        let account = await redisAccountSync.getAccountAsync(uid);
        let taskProcessInfo = await this.getMissionTaskProcessInfo(account);
        let mission_task_once = taskProcessInfo.mission_only_once;
        // logger.error(`同步任务进度到数据库 ---- ${uid} - mission_task_once:`, mission_task_once);
        return mission_task_once || {};
    }


    static async delUserMissionInfo(uid) {
        let cmds = [];
        for (let i = 0; i < daily_quest_cfg.length; i++) {
            let item = daily_quest_cfg[i];
            let taskKey = getTaskKey(getMissionPrefix(item.type), item.type, item.condition, item.value1);
            cmds.push(['HDEL', taskKey, uid]);
        }

        for (let i = 0; i < active_activequest_cfg.length; i++) {
            let item = active_activequest_cfg[i];
            let taskKey = getTaskKey(getActivePrefix(item.repeat), item.repeat, item.condition, item.value1);
            cmds.push(['HDEL', taskKey, uid]);
        }

        await redisConnector.multi(cmds);
    }

    /**
     * 获取活动任务进度数据
     * @param {*} account 
     */
    static async getActivityTaskProcessInfo(account) {

        let active_stat_once = account.active_stat_once;
        let active_stat_reset = account.active_stat_reset;
        let cmds = [];
        let linkMap = {};
        for (let i = 0; i < active_activequest_cfg.length; i++) {
            let item = active_activequest_cfg[i];
            let taskKey = getTaskKey(getActivePrefix(item.repeat), item.repeat, item.condition, item.value1);
            cmds.push(['HGET', taskKey, account.id]);
            linkMap[i] = {
                mainType: item.repeat,
                condition: item.condition,
                value1: item.value1,
                taskId: item.id
            };
        }

        let once = {}, daily = {};
        let redisProcessInfo = await redisConnector.multi(cmds);
        for (let i = 0; i < redisProcessInfo.length; i++) {
            if (redisProcessInfo[i] != null) {
                let linkInfo = linkMap[i];
                let processValue = Number(redisProcessInfo[i]);
                if (Number.isNaN(processValue)) {
                    logger.error('活动任务统计数值异常，无法处理该类型任务进度，taskInfo = ', linkInfo);
                    continue;
                }
                if (linkInfo.mainType == TASK_MAIN_TYPE.ONCE) {
                    once[linkInfo.condition] = once[linkInfo.condition] || {};

                    if (active_stat_once && active_stat_once[linkInfo.taskId] == 1) {
                        once[linkInfo.condition] = once[linkInfo.condition] = -1;
                    } else {
                        once[linkInfo.condition][linkInfo.value1] = processValue;
                    }
                } else {
                    daily[linkInfo.condition] = daily[linkInfo.condition] || {};
                    if (active_stat_reset && active_stat_reset[linkInfo.taskId] == 1) {
                        daily[linkInfo.condition][linkInfo.value1] = -1;
                    } else {
                        daily[linkInfo.condition][linkInfo.value1] = processValue;
                    }
                }
            }
        }

        return { active_once: once, active_daily_reset: daily };
    }

    /**
     * 获取活动任务(新手狂欢活动)进度数据
     * @param {*} account 
     */
    static async getNewbieTaskProcessInfo(account) {
        let active_stat_newbie = account.active_stat_newbie;
        logger.error('active_stat_newbie:\n', active_stat_newbie);
        let cmds = [];
        let linkMap = {};
        let notRepeated = {};
        let linkIndex = 0;
        for (let i = 0; i < active_newbie_cfg.length; i++) {
            let item = active_newbie_cfg[i];
            item.type = TASK_MAIN_TYPE.ONCE;
            let taskKey = getTaskKey(TASK_PREFIX.MISSION_TASK_ONCE, item.type, item.condition, item.value1);
            if (!notRepeated[taskKey]) {
                cmds.push(['HGET', taskKey, account.id]);
                linkMap[linkIndex] = {
                    mainType: item.type,
                    taskId: item.id,
                    taskKey: taskKey
                };
                linkIndex++;
                notRepeated[taskKey] = [];
            }
            notRepeated[taskKey].push(item.id);
        }
        logger.error('cmds:\n', cmds);
        let redisProcessInfo = await redisConnector.multi(cmds);
        let newbie = {};

        for (let i = 0; i < redisProcessInfo.length; i++) {
            if (redisProcessInfo[i] != null) {
                let linkInfo = linkMap[i];
                logger.error('linkInfo:\n', linkInfo);
                let processValue = Number(redisProcessInfo[i]);
                if (Number.isNaN(processValue)) {
                    logger.error('新手狂欢活动统计数值异常，无法处理该类型任务进度，taskId = ', linkInfo.taskId);
                    continue;
                }
                if (linkInfo.mainType == TASK_MAIN_TYPE.ONCE) {
                    if (active_stat_newbie[linkInfo.taskId] != -1) {
                        let taskIds = notRepeated[linkInfo.taskKey];
                        let taskId = null;
                        for (let id in active_stat_newbie) {
                            let nId = Number(id);
                            if (isNaN(nId)) continue;
                            if (taskIds.indexOf(nId) != -1) {
                                taskId = id;
                                break;
                            }
                        }
                        if (taskId == null) {
                            active_stat_newbie[linkInfo.taskId] = 1;
                            taskId = linkInfo.taskId;
                        }
                        newbie[taskId] = processValue;
                    } else {
                        newbie[linkInfo.taskId] = -1;
                    }
                }
            }
        }
        account.active_stat_newbie = active_stat_newbie;
        account.commit();
        return { active_stat_newbie: newbie };
    }

    static getInitNewbie(condition, value1) {
        for (let i = 0; i < active_newbie_cfg.length; i++) {
            let item = active_newbie_cfg[i];
            if (item.condition == condition && item.value1 == value1) {
                return item.id;
            }
        }
        return null;
    }

    static getNewbieInfo(id) {
        for (let i = 0; i < active_newbie_cfg.length; i++) {
            let item = active_newbie_cfg[i];
            if (item.id == id) {
                return item;
            }
        }
        return null;
    }

    static checkStatus(statusList, condition, value1) {
        for (let i in statusList) {
            let newbieStatus = statusList[i];
            if (newbieStatus.condition == condition && newbieStatus.value1 == value1) {
                return true;
            }
        }
        return false;
    }

    /**
     * 获取新手狂欢状态信息.
     * @param {*} account 
     */
    static async getNewbieStatInfo(account, reward_status) {
        let cmds = [];
        let linkMap = {};
        let notRepeated = {};
        let linkIndex = 0;
        for (let i = 0; i < active_newbie_cfg.length; i++) {
            let item = active_newbie_cfg[i];
            let taskKey = getTaskKey(getMissionPrefix(1), 1, item.condition, item.value1);
            if (!notRepeated[taskKey]) {
                cmds.push(['HGET', taskKey, account.id]);
                linkMap[linkIndex] = {
                    mainType: item.type,
                    taskId: item.id,
                    condition: item.condition,
                    value1: item.value1,
                    taskKey: taskKey
                };
                linkIndex++;
                notRepeated[taskKey] = [];
            }
            notRepeated[taskKey].push(item.id);
        }

        let redisProcessInfo = await redisConnector.multi(cmds);

        let statusList = [];
        for (let itemId in reward_status) {
            let itemInfo = MissionModel.getNewbieInfo(itemId);
            statusList.push({
                condition: itemInfo.condition,
                value1: itemInfo.value1,
            });
        }

        for (let i = 0; i < redisProcessInfo.length; i++) {
            if (redisProcessInfo[i] != null) {
                let linkInfo = linkMap[i];
                let redisInfo = +redisProcessInfo[i];
                let keyFlag = linkInfo.taskKey.split(':')[1];
                let typeList = keyFlag.split('_');
                let condition = typeList[1];
                let value1 = typeList[2];
                if (!MissionModel.checkStatus(statusList, condition, value1)) {
                    let initId = MissionModel.getInitNewbie(condition, value1);
                    if (null != initId) {
                        reward_status[initId] = 1;
                    }
                }
            }
        }
        return reward_status;
    }

    static async getRedisProcessInfo(account) {
        let cmds = [];
        let linkMap = {};
        let notRepeated = {};
        let linkIndex = 0;
        for (let i = 0; i < daily_quest_cfg.length; i++) {
            let item = daily_quest_cfg[i];
            let taskKey = getTaskKey(getMissionPrefix(item.type), item.type, item.condition, item.value1);
            if (!notRepeated[taskKey]) {
                cmds.push(['HGET', taskKey, account.id]);
                linkMap[linkIndex] = {
                    mainType: item.type,
                    taskId: item.id,
                    taskKey: taskKey
                };
                linkIndex++;
                notRepeated[taskKey] = [];
            }
            notRepeated[taskKey].push(item.id);

        }
        for (let i = 0; i < active_newbie_cfg.length; i++) {
            let item = active_newbie_cfg[i];
            let taskKey = getTaskKey(getMissionPrefix(1), 1, item.condition, item.value1);
            if (!notRepeated[taskKey]) {
                cmds.push(['HGET', taskKey, account.id]);
                linkMap[linkIndex] = {
                    mainType: item.type,
                    taskId: item.id,
                    taskKey: taskKey
                };
                linkIndex++;
                notRepeated[taskKey] = [];
            }
            notRepeated[taskKey].push(item.id);
        }

        let redisProcessInfo = await redisConnector.multi(cmds);

        let ret = {};
        for (let i = 0; i < redisProcessInfo.length; i++) {
            if (redisProcessInfo[i] != null) {
                let linkInfo = linkMap[i];
                ret[linkInfo.taskKey.split(':')[1]] = +redisProcessInfo[i];
            }
        }
        return ret;
    }

    /**
     * 获取成就任务进度数据
     * @param {*} account 
     */
    static async getMissionTaskProcessInfo(account) {
        let cmds = [];
        let linkMap = {};
        let notRepeated = {};
        let linkIndex = 0;
        let mission_only_once = account.mission_only_once;
        let mission_daily_reset = account.mission_daily_reset;
        for (let i = 0; i < daily_quest_cfg.length; i++) {
            let item = daily_quest_cfg[i];
            let taskKey = getTaskKey(getMissionPrefix(item.type), item.type, item.condition, item.value1);
            if (!notRepeated[taskKey]) {
                cmds.push(['HGET', taskKey, account.id]);
                linkMap[linkIndex] = {
                    mainType: item.type,
                    taskId: item.id,
                    taskKey: taskKey
                };
                linkIndex++;
                notRepeated[taskKey] = [];
            }
            notRepeated[taskKey].push(item.id);

        }

        let redisProcessInfo = await redisConnector.multi(cmds);

        let once = Object.deepClone(mission_only_once), daily = Object.deepClone(mission_daily_reset);
        once.achievePoint = account.achieve_point;

        for (let i = 0; i < redisProcessInfo.length; i++) {
            if (redisProcessInfo[i] != null) {
                let linkInfo = linkMap[i];
                let processValue = Number(redisProcessInfo[i]);
                if (Number.isNaN(processValue)) {
                    logger.error('成就任务统计数值异常，无法处理该类型任务进度，taskId = ', linkInfo.taskId);
                    continue;
                }
                if (linkInfo.mainType == TASK_MAIN_TYPE.ONCE) {
                    if (mission_only_once[linkInfo.taskId] != -1) {
                        let taskIds = notRepeated[linkInfo.taskKey];
                        let taskId = null;
                        for (let id in mission_only_once) {
                            let nId = Number(id);
                            if (isNaN(nId)) continue;
                            if (taskIds.indexOf(nId) != -1) {
                                taskId = id;
                                break;
                            }
                        }
                        if (taskId == null) {
                            mission_only_once[linkInfo.taskId] = 1;
                            taskId = linkInfo.taskId;
                        }

                        if (mission_only_once[taskId] == -1) {
                            once[taskId] = -1;
                        } else {
                            once[taskId] = processValue;
                        }

                    } else {
                        once[linkInfo.taskId] = -1;
                    }
                } else {
                    if (mission_daily_reset[linkInfo.taskId] != -1) {
                        let taskIds = notRepeated[linkInfo.taskKey];
                        let taskId = null;
                        for (let id in mission_daily_reset) {
                            let nId = Number(id);
                            if (isNaN(nId)) continue;
                            if (taskIds.indexOf(nId) != -1) {
                                taskId = id;
                                break;
                            }
                        }

                        if (taskId == null) {
                            mission_daily_reset[linkInfo.taskId] = 1;
                            taskId = linkInfo.taskId;
                        }

                        if (mission_daily_reset[taskId] == -1) {
                            daily[taskId] = -1;
                        } else {
                            daily[taskId] = processValue;
                        }
                    } else {
                        daily[linkInfo.taskId] = -1;
                    }
                }
            }
        }
        account.mission_only_once = mission_only_once;
        account.mission_daily_reset = mission_daily_reset;
        account.commit();
        return { mission_only_once: once, mission_daily_reset: daily };
    }

    /**
     * 统计任务并提交
     * @param taskType 类型 MissionModel.TaskType
     * @param value  值
     * @param subTaskType  子类型(0任意，其他标识任务对象ID)
     */
    commitProcess(taskType, value = 1, subTaskType = 0) {
        this.cacheProcess(taskType, value, subTaskType);
        this.commit();
    }

    //TODO 老版本
    addProcess(taskType, value = 1, subTaskType = 0) {
        this.cacheProcess(taskType, value, subTaskType);
        this.commit();
    }

    //TODO 老版本
    updateProcess(taskType, value = 1, subTaskType = 0) {
        this.cacheProcess(taskType, value, subTaskType);
    }

    /**
     * 缓存任务进度，后续需要单独调用commit()提交数据
     * @param taskType 类型 MissionModel.TaskType
     * @param value 值
     * @param subTaskType 子类型
     */
    cacheProcess(taskType, value = 1, subTaskType = 0) {
        //是否复合任务
        if (subTaskType !== 0 && this._isMultiType(taskType)) {
            this.cacheProcess(taskType, value, 0);
        }
        this._addMissionDailyReset(taskType, value, subTaskType);
        this._addMissionOnlyOnce(taskType, value, subTaskType);
        if (this._hasActivity()) {
            this._addActivityDailyReset(taskType, value, subTaskType);
            this._addActivityOnlyOnce(taskType, value, subTaskType);
        }
    }

    /**
     * 成就
     * @private
     */
    _addMissionOnlyOnce(taskType, value, subTaskType, prefix = TASK_PREFIX.MISSION_TASK_ONCE) {
        let taskKey = getTaskKey(prefix, TASK_MAIN_TYPE.ONCE, taskType, subTaskType);
        //logger.error('taskKey:', taskKey);

        //任务类型是否存在
        if (!supportTaskMap[taskKey]) {
            return;
        }

        //检查任务是否在统计范围之类
        if (this._ignoreTaskMap[taskKey]) {
            return;
        }

        let processInfo = this._taskProcessMap[taskKey];
        processInfo = processInfo || {
            value: 0,
            change: false
        };
        this._taskProcessMap[taskKey] = this._getNewProcess(taskType, value, processInfo);
    }

    /**
     * 日常
     * @private
     */
    _addMissionDailyReset(taskType, value, subTaskType, prefix = TASK_PREFIX.MISSION_TASK_DAILY) {
        let taskKey = getTaskKey(prefix, TASK_MAIN_TYPE.DAILY, taskType, subTaskType);

        //任务类型是否存在
        if (!supportTaskMap[taskKey]) {
            return;
        }

        //检查任务是否在统计范围之类
        if (this._ignoreTaskMap[taskKey]) {
            return;
        }

        let processInfo = this._taskProcessMap[taskKey];
        processInfo = processInfo || {
            value: 0,
            change: false
        };

        this._taskProcessMap[taskKey] = this._getNewProcess(taskType, value, processInfo);
    }

    /**
     * 每日活动
     * @private
     */
    _addActivityDailyReset(taskType, value, subTaskType, prefix = TASK_PREFIX.ACTIVE_TASK_DAILY) {
        let taskKey = getTaskKey(prefix, TASK_MAIN_TYPE.DAILY, taskType, subTaskType);

        //任务类型是否存在
        if (!supportTaskMap[taskKey]) {
            return;
        }

        //检查任务是否在统计范围之类
        if (this._ignoreTaskMap[taskKey]) {
            return;
        }

        let processInfo = this._taskProcessMap[taskKey];
        processInfo = processInfo || {
            value: 0,
            change: false
        };

        this._taskProcessMap[taskKey] = this._getNewProcess(taskType, value, processInfo);
    }

    /**
     * 非每日活动
     * @private
     */
    _addActivityOnlyOnce(taskType, value, subTaskType, prefix = TASK_PREFIX.ACTIVE_TASK_ONCE) {
        let taskKey = getTaskKey(prefix, TASK_MAIN_TYPE.ONCE, taskType, subTaskType);

        //任务类型是否存在
        if (!supportTaskMap[taskKey]) {
            return;
        }

        //检查任务是否在统计范围之类
        if (this._ignoreTaskMap[taskKey]) {
            return;
        }

        let processInfo = this._taskProcessMap[taskKey];
        processInfo = processInfo || {
            value: 0,
            change: false
        };

        this._taskProcessMap[taskKey] = this._getNewProcess(taskType, value, processInfo);
    }

    _getNewProcess(taskType, newValue, processInfo) {
        let _newValue = Number(newValue);
        if (isNaN(_newValue)) {
            logger.error('成就统计外部输入数值异常, 此次提交无效, newValue =', newValue);
            return processInfo;
        }

        let isMax = this._isMax(taskType);
        if (isMax) {
            if (_newValue > processInfo.value) {
                processInfo.value = _newValue;
                processInfo.change = true;
            }
        } else {
            processInfo.value += _newValue;
            processInfo.change = true;
        }

        return processInfo;
    }

    _isMultiType(taskType) {
        return MissionModel.Base[taskType].multiType;
    }

    _isMax(taskType) {
        return MissionModel.Base[taskType].incrType == 'max';
    }

    /**
     * 活动是否开启
     * @returns {boolean}
     * @private
     */
    _hasActivity() {
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

    /**
     * 提交
     */
    async commit() {
        let cmds = [];
        let max_cmds = [];
        let max_index = 0;
        let max_info = {};

        for (let key in this._taskProcessMap) {
            let processInfo = this._taskProcessMap[key];
            if (!processInfo.change) continue;

            let taskType = key.split(':')[1].split('_')[1];
            let isMax = this._isMax(taskType);
            if (isMax) {
                //TODO 更新最大值
                max_cmds.push(['HGET', key, this._uid]);
                max_info[max_index] = {
                    value: this._taskProcessMap[key],
                    redisKey: key
                };
                max_index++;
            } else {
                if (!isNaN(Number(processInfo.value))) {
                    cmds.push(['HINCRBY', key, this._uid, processInfo.value]);
                } else {
                    logger.error('任务统计提交数值错误, key=', key);
                    logger.error('任务统计提交数值错误, value=', JSON.stringify(processInfo.value));
                    logger.error('任务统计提交数值错误, taskType=', taskType);
                }

                processInfo.value = 0;
            }
            processInfo.change = false;
        }

        if (cmds.length > 0) {
            // logger.error('cmds=', cmds);
            await redisConnector.multi(cmds);
        }

        if (max_cmds.length > 0) {
            // logger.error('max_cmds=', max_cmds);
            let commit_max_cmds = [];
            let redisMaxInfo = await redisConnector.multi(max_cmds);
            // logger.error('redisMaxInfo=', redisMaxInfo);
            for (let i = 0; i < redisMaxInfo.length; i++) {
                let redisValue = redisMaxInfo[i] || 0;
                redisValue = Number(redisValue);
                let memInfo = max_info[i];
                if (memInfo.value.value > redisValue) {
                    if (!isNaN(Number(memInfo.value.value))) {
                        commit_max_cmds.push(['HSET', memInfo.redisKey, this._uid, memInfo.value.value]);
                    } else {
                        logger.error('MAX任务统计提交数值错误, key=', memInfo.redisKey);
                        logger.error('MAX任务统计提交数值错误, value=', JSON.stringify(memInfo.value));
                    }

                } else {
                    this._taskProcessMap[memInfo.redisKey].value = redisValue;
                }
                // logger.error('commit_max_cmds=', commit_max_cmds);
                await redisConnector.multi(commit_max_cmds);
            }
        }

    }
}

MissionModel.Type = {
    DAILY_MISSION: 0,
    ONCE_MISSION: 1,
    REGISTER: 2,
    ACTIVE: 3,
    ACTIVE_DAY: 4
};

MissionModel.TaskType = {
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
    WEAPON_DRAW: 31,//参加x次皮肤抽奖
};

const BASE = {};

BASE[MissionModel.TaskType.CATCH_FISH] = { "incrType": "incr", "multiType": true };
BASE[MissionModel.TaskType.USE_SKILL] = { "incrType": "incr", "multiType": true };
BASE[MissionModel.TaskType.UPDATE_USER_LV] = { "incrType": "max", "multiType": false };
BASE[MissionModel.TaskType.UPDATE_WEAPON_LV] = { "incrType": "max", "multiType": false };
BASE[MissionModel.TaskType.USE_FISH_CATCH_FISH] = { "incrType": "incr", "multiType": true };
BASE[MissionModel.TaskType.GET_WEAPON_SKIN] = { "incrType": "max", "multiType": false };
BASE[MissionModel.TaskType.ONE_CATCH_FISH] = { "incrType": "max", "multiType": false };
BASE[MissionModel.TaskType.ONE_GET_GOLD] = { "incrType": "max", "multiType": false };
BASE[MissionModel.TaskType.GET_GOLD] = { "incrType": "incr", "multiType": false };
BASE[MissionModel.TaskType.USE_DIAMOND] = { "incrType": "incr", "multiType": false };
BASE[MissionModel.TaskType.USE_GOLD] = { "incrType": "incr", "multiType": false };
BASE[MissionModel.TaskType.SHARE_TIMES] = { "incrType": "incr", "multiType": false };
BASE[MissionModel.TaskType.CONTINUE_LOGIN] = { "incrType": "incr", "multiType": false };
BASE[MissionModel.TaskType.GET_RANK_LV] = { "incrType": "incr", "multiType": true };
BASE[MissionModel.TaskType.GET_VIP_LV] = { "incrType": "max", "multiType": false };
BASE[MissionModel.TaskType.GET_ACHIEVE_POINT] = { "incrType": "incr", "multiType": false };
BASE[MissionModel.TaskType.GOLD_TIMES] = { "incrType": "incr", "multiType": false };
BASE[MissionModel.TaskType.CHARG_PEARL] = { "incrType": "incr", "multiType": false };
BASE[MissionModel.TaskType.DEFEND_GODDESS] = { "incrType": "incr", "multiType": false };
BASE[MissionModel.TaskType.STOCKING_FISH] = { "incrType": "incr", "multiType": false };
BASE[MissionModel.TaskType.GODDESS_LEVEL] = { "incrType": "max", "multiType": false };
BASE[MissionModel.TaskType.PETFISH_TOTAL_LEVEL] = { "incrType": "max", "multiType": false };
BASE[MissionModel.TaskType.UNLOCK_GODDESS] = { "incrType": "max", "multiType": false };
BASE[MissionModel.TaskType.PLAY_LITTLE_GAME] = { "incrType": "max", "multiType": false };
BASE[MissionModel.TaskType.GOLD_FIRST] = { "incrType": "max", "multiType": false };
BASE[MissionModel.TaskType.CHALLENGE_POS] = { "incrType": "max", "multiType": false };
BASE[MissionModel.TaskType.CHALLENGE_WIN] = { "incrType": "incr", "multiType": false };
BASE[MissionModel.TaskType.CHALLENGE_DUANWEI] = { "incrType": "max", "multiType": false };
BASE[MissionModel.TaskType.MAX] = { "incrType": "incr", "multiType": false };
BASE[MissionModel.TaskType.WEAPON_DRAW] = { "incrType": "incr", "multiType": false };


MissionModel.Base = BASE;
MissionModel.EXPORT_TOOLS = EXPORT_TOOLS;

module.exports = MissionModel;


