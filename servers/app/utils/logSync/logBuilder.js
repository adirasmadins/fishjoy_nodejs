const moment = require('moment');
const taskPool = require('../task').taskPool;
const task_conf = require('./config');
const LogInsertTask = require('./logInsertTask');
const logTableDef = require('./logTableDef');
const item_item_cfg = require('../imports').DESIGN_CFG.item_item_cfg;
const tools = require('../../utils/tools');
const itemDef = require('../../consts/itemDef');
const REDISKEY = require('../../models/index').REDISKEY;

/**
 * TODO：日志构建
 */
class LogBuilder {
    constructor() {
        this.logInsertTask = new LogInsertTask(task_conf.logInsert);
        taskPool.addTask('logInsertTask', this.logInsertTask);
        this.itemMap = this._initItemMap();
    }

    _genNow() {
        return moment().format('YYYY-MM-DD HH:mm:ss'); //坑爹：注意此处格式化，否则数据库可能写入失败
    }

    _initItemMap() {
        let map = new Map();
        for (let i in item_item_cfg) {
            if (i == itemDef.GOLD) {
                map.set(i, ['gold']);
                continue;
            } else if (i == itemDef.DIAMOND) {
                map.set(i, ['pearl']);
                continue;
            }
            let item = item_item_cfg[i];
            if (item.type == 3) {
                map.set(i, ['skill', item.id]);
            } else {
                map.set(i, ['package', item.type, i]);
            }
        }
        return map;
    }

    /**
     * 记录金币日志
     * @param {*} uid
     * @param {*} gain
     * @param {*} cost
     * @param {*} total
     * @param {*} scene
     * @param {*} level
     */
    addGoldLog(uid, gain, cost, total, scene, level, fire) {
        let log = {
            account_id: uid,
            log_at: this._genNow(),
            gain: gain,
            cost: cost,
            total: total,
            duration: 0,
            scene: scene,
            nickname: 0,
            level: level,
            fire: fire,
        };

        this.logInsertTask.pushData(logTableDef.TYPE.GOLD, log);
    }

    addGoldLogEx(obj) {
        obj.log_at = this._genNow();
        obj.fire = obj.fire || 0;
        this.logInsertTask.pushData(logTableDef.TYPE.GOLD, obj);
    }

    /**
     * 记录钻石日志
     * @param {*} uid
     * @param {*} gain
     * @param {*} cost
     * @param {*} total
     * @param {*} scene
     * @param {*} level
     */
    addPearlLog(uid, gain, cost, total, scene, level) {
        let log = {
            account_id: uid,
            log_at: this._genNow(),
            gain: gain,
            cost: cost,
            total: total,
            scene: scene,
            nickname: 0
        };

        this.logInsertTask.pushData(logTableDef.TYPE.PEARL, log);
    }

    addPearlLogEx(obj) {
        obj.log_at = this._genNow();
        this.logInsertTask.pushData(logTableDef.TYPE.PEARL, obj);
    }

    addSkillLog(uid, skill_id, gain, cost, total) {
        let log = {
            account_id: uid,
            skill_id: skill_id,
            log_at: this._genNow(),
            gain: gain,
            cost: cost,
            total: total,
            nickname: 0
        };

        this.logInsertTask.pushData(logTableDef.TYPE.SKILL, log);
    }

    async addLoginLog(uid, deviceId, ip) {
        // yxl_20180408_01
        if (deviceId) {
            // 登录账号添加到活跃设备中
            tools.RedisUtil.sadd(REDISKEY.ACTIVE_DEVICE_1_DAY, deviceId);
            tools.RedisUtil.sadd(REDISKEY.ACTIVE_DEVICE_1_HOUR, deviceId);
        }
        else {
            deviceId = '';
        }
        if (!ip) {
            ip = '';
        }
        let log = {
            account_id: uid,
            log_at: this._genNow(),
            nickname: 0,
            deviceId: deviceId,
            ip: ip,
        };

        this.logInsertTask.pushData(logTableDef.TYPE.LOGIN, log);
    }

    addLoginLogEx(obj) {
        obj.log_at = this._genNow();
        obj.nickname = 0;
        this.logInsertTask.pushData(logTableDef.TYPE.LOGIN, obj);
    }

    addHuafeiLog(obj) {
        obj.time = this._genNow();
        this.logInsertTask.pushData(logTableDef.TYPE.HUAFEI, obj);
    }

    addGameLog(item_list, account, scene, hint) {
        logger.info("item_list:", item_list);
        let goldGain = 0;
        let diamondGain = 0;
        let huafeiGain = 0;
        for (let i = 0; i < item_list.length; i++) {
            let item = item_list[i];
            let item_id = item.item_id;
            let item_num = item.item_num;
            if (itemDef.GOLD == item_id) {
                goldGain += item_num;
            }
            if (itemDef.DIAMOND == item_id) {
                diamondGain += item_num;
            }
            if ('i003' == item_id) {
                huafeiGain += item_num;
            }
        }
        let uid = account.id;
        if (goldGain != 0) {
            // yDONE: 金币记录日志
            this.addGoldLogEx({
                account_id: uid,
                log_at: new Date(),
                gain: goldGain > 0 ? goldGain : 0,
                cost: goldGain < 0 ? -goldGain : 0,
                duration: 0,
                total: account.gold,
                scene: scene,
                nickname: 0,
                level: account.level,
            });
        }
        if (diamondGain != 0) {
            // yDONE: 钻石记录日志
            this.addPearlLogEx({
                account_id: uid,
                log_at: new Date(),
                gain: diamondGain > 0 ? diamondGain : 0,
                cost: diamondGain < 0 ? -diamondGain : 0,
                total: account.pearl,
                scene: scene,
                nickname: 0,
            });
        }
        if (huafeiGain != 0) {
            // yDONE: 话费券记录日志
            let total = account.package['9']['i003'];
            let comment = hint + '话费券';
            logBuilder.addHuafeiLog({
                uid: uid,
                gain: huafeiGain > 0 ? huafeiGain : 0,
                cost: huafeiGain < 0 ? -huafeiGain : 0,
                total: total,
                scene: scene,
                comment: comment,
                time: new Date(),
            });
        }
    }

    /**
     * 记录物品日志
     */
    addItemLog(uid, itemId, delta, left, scene, playerLevel) {

        let log = {
            "`account_id`": uid,
            "`itemId`": itemId,
            "`log_at`": this._genNow(),
            "`delta`": delta,
            "`left`": left,
            "`scene`": scene,
            "`playerLevel`": playerLevel
        };
        let pushData = this.logInsertTask.pushData(logTableDef.TYPE.ITEM, log);

        logger.info("addItemLog:", pushData);

    }

    /**
     * 记录活动日志
     */
    addActivityLog(uid, itemId, itemNum, itemTotal, activityName, missionId) {
        let log = {
            "`account_id`": uid,
            "`itemId`": itemId,
            "`log_at`": this._genNow(),
            "`itemNum`": itemNum,
            "`itemTotal`": itemTotal,
            "`activityName`": activityName,
            "`missionId`": missionId
        };
        let pushData = this.logInsertTask.pushData(logTableDef.TYPE.ACTIVITY, log);

        logger.info("addActivityLog:", pushData);

    }

    /**
     *
     * @param item_list [{item_id:xx,item_num:xx},...]
     * @param account
     * @param scene
     * @param delta 默认1，减少-1
     */
    addItemLogByAccount(item_list, account, scene, delta = 1) {
        logger.info("执行item日志插入:", item_list, scene);
        if (delta !== -1 && delta !== 1) {
            logger.error(`执行item日志错误,delta类型:${typeof delta},值:${delta},场景:${scene}`);
            return;
        }
        for (let i in item_list) {
            let item = item_list[i];
            let item_id = item.item_id;
            let item_num = item.item_num;
            if (0 == item_num) continue;// 物品没有变化, 不记录日志
            if (item_id == itemDef.GOLD) continue;
            let keyMap = this.itemMap.get(item_id);
            if (!keyMap) continue;
            let size = keyMap.length;
            let left = account[keyMap[0]];
            for (let i = 1; i < size; i++) {
                if (left && left[keyMap[i]] != null) {
                    left = left[keyMap[i]];
                }
            }
            if (typeof left == 'object') {
                if (item_id != 'i102' && item_id != 'i103') logger.error("addItemLogByAccount left 类型错误", item_id);
                continue;
            }
            this.addItemLog(account.id, item_id, delta * item_num, left, scene, account.level);
        }
    }

    /**
     *
     * @param item_list  item_list [{item_id:xx,item_num:xx},...]
     * @param account
     * @param activityName
     * @param missionId
     * @param delta delta 默认1，减少-1
     */
    addActivityLogByAccount(item_list, account, activityName, missionId, delta = 1) {
        if (delta !== -1 && delta !== 1) {
            logger.error(`执行item日志错误,delta类型:${typeof delta},值:${delta},场景:${activityName}`);
            return;
        }
        for (let i in item_list) {
            let item = item_list[i];
            let item_id = item.item_id;
            let item_num = item.item_num;
            if (0 == item_num) continue;// 物品没有变化, 不记录日志
            if (item_id == itemDef.GOLD) continue;
            let keyMap = this.itemMap.get(item_id);
            if (!keyMap) continue;
            let size = keyMap.length;
            let left = account[keyMap[0]];
            for (let i = 1; i < size; i++) {
                if (left && left[keyMap[i]] != null) {
                    left = left[keyMap[i]];
                }
            }
            if (typeof left == 'object') {
                if (item_id != 'i102' && item_id != 'i103') logger.error("addActivityLogByAccount left 类型错误", item_id);
                continue;
            }
            this.addActivityLog(account.id, item_id, delta * item_num, left, activityName, missionId);
        }
    }

    /**
     * 增加女神挑战日志
     * @param {*玩家id} accountId
     * @param {*波数} waveCount
     * @param {*行为类型，1-进入,2-过关,3-结算} actionType
     */
    addGoddessLog(accountId, waveCount, actionType) {
        let log = {
            account_id: accountId,
            log_at: this._genNow(),
            wave: waveCount,
            '`type`': actionType,
        };
        this.logInsertTask.pushData(logTableDef.TYPE.GODDESS, log);
    }

    addLinkLog(uid, api) {
        let obj = {
            log_at: this._genNow(),
            uid: uid,
            api: api
        };
        this.logInsertTask.pushData(logTableDef.TYPE.LINK, obj);
    }

    /**
     * 通用添加金币物品钻石技能日志方法
     * @param item_list [{item_id:xx,item_num:xx},{},...]
     * @param account 帐号
     * @param scene 场景
     * @param delta 增加or减少,默认增加1，减少为-1，其他赋值均为非法
     * @param fire 金币日志中开火数，默认为0
     */
    addGoldAndItemLog(item_list, account, scene, delta = 1, fire = 0) {
        logger.info("执行addGoldAndItemLog:", item_list, scene);
        if (delta !== -1 && delta !== 1) {
            logger.error(`执行addGoldAndItemLog错误,delta类型:${typeof delta},值:${delta},场景:${scene}`);
            return;
        }
        for (let i in item_list) {
            let item = item_list[i];
            let item_id = item.item_id;
            let item_num = item.item_num;
            if (typeof item_num !== 'number') {
                logger.error(`addGoldAndItemLog item数据错误${item}`);
                continue;
            }
            if (0 == item_num) continue;// 数量没有变化, 不记录日志
            let keyMap = this.itemMap.get(item_id);
            if (!keyMap) {
                logger.error(`addGoldAndItemLog item_id不存在:${item_id}`);
                continue;
            }
            let size = keyMap.length;
            let left = account[keyMap[0]];
            for (let i = 1; i < size; i++) {
                if (left && left[keyMap[i]] != null) {
                    left = left[keyMap[i]];
                }
            }
            if (typeof left == 'object') {
                if (item_id != 'i102' && item_id != 'i103') logger.error(`addGoldAndItemLog left 类型错误${item_id}`);
                continue;
            }
            let num = item_num * delta;
            if (item_id == itemDef.GOLD) {
                let gain = num > 0 ? num : 0;
                let cost = num > 0 ? 0 : -num;
                this.addGoldLog(account.id, gain, cost, left, scene, account.level, fire);
            } else {
                this.addItemLog(account.id, item_id, num, left, scene, account.level);
            }
        }
    }

}

module.exports = new LogBuilder();