/**
 * 战斗房间内日志
 * 金币、钻石 消耗/获得：注意按场景记录
 * 技能 消耗，无获得
 * 其他：
 */

const LOG_DT = 30; //金币钻石日志写入周期，即每隔指定时间插入一条

 class FishingLog {
    constructor(account) {
        this._account = account;
        this._uid = account.id;
        this._logs = {
            gold: {
                funcName: 'addGoldLog',
                sdata: {},
                total: account.gold,
            },
            pearl: {
                funcName: 'addPearlLog',
                sdata: {},
                total: account.pearl,
            }
        };
        logger.error('-----------------FishingLog');
    }

    setCheatProc (func) {
        //
    }

    addGoldGot (gain, cost, fire) {
        //
    }

    /**
     * 增加一条变更记录
     * @param {*字段名} field 
     * @param {*场景标记} flag 
     * @param {*变化量，>0获得，<0消耗} value 
     * @param {*当前等级} level 
     */
    _addOneLog (field, flag, value, level, isFireCounting, isRightNow) {
        if (!field || !flag || !value) return;
        let log = this._logs[field];
        let sdata = log.sdata;
        if (!sdata[flag]) {
            sdata[flag] = {
                gain: 0,
                cost: 0,
                level: 1,
                fire: 0,
                dt: 0,
            };
        }

        let data = sdata[flag];
        if (value > 0) {
            data.gain += value;
        }else if (value < 0) {
            data.cost += -value;
            isFireCounting && (data.fire ++);
        }
        data.level = level;
        if (data.dt <= 0) {
            if (log.lastFlag && log.lastFlag != flag) {
                let tt = LOG_DT/5;
                if (sdata[log.lastFlag].dt > tt) {
                    sdata[log.lastFlag].dt = tt;
                }
            }
            log.lastFlag = flag;
            data.dt = LOG_DT;
        }
        data.timestamp = new Date().getTime();
    }

    /**
     * 增加金币日志
     * @param {*变更场景} flag 
     * @param {*金币变化量} gold 
     * @param {*是否计入开炮数} isFireCounting 
     */
    addGoldLog (flag, gold, level, isFireCounting, isRightNow) {
        this._addOneLog('gold', flag, gold, level, isFireCounting, isRightNow);
    }

    /**
     * 增加钻石日志，同金币
     * @param {*变更场景} flag 
     * @param {*钻石变化量} diamond 
     */
    addDiamondLog (flag, diamond, level) {
        this._addOneLog('pearl', flag, diamond, level);
    }

    /**
     * 增加技能使用日志
     * @param {*玩家id} uId 
     * @param {*技能id} skillId 
     * @param {*该技能剩余数量} skillCount 
     */
    addSkillUsingLog (skillId, skillCount) {
        skillId > 0 && logBuilder.addSkillLog(this._uid, skillId, 0, 1, skillCount);
    }

    _write (funcName, uid, data, flag, total) {
        logBuilder[funcName](uid, data.gain, data.cost, total, parseInt(flag), data.level, data.fire);
        data.gain = 0;
        data.cost = 0;
        data.fire = 0;
        data.dt = 0;
    }

    /**
     * 及时写入所有日志：金币+钻石
     * @param {*变更场景} flag 
     * @param {*玩家id} uId 
     * @param {*玩家当前金币总数} uGold 
     * @param {*玩家当前钻石总数} uDiamond 
     * @param {*玩家等级} uLevel 
     */
    logAll () {
        let uid = this._uid;
        let logs = this._logs;
        for (let field in logs) {
            let fds = logs[field];
            let funcName = fds.funcName;
            let func = logBuilder[funcName];
            if (!func || typeof func !== 'function') {
                logger.error('logAll: no such function in logBuilder = ', funcName);
                continue;
            }
            let tags = {};
            let rd = [];
            let sdata = fds.sdata;
            for (let flag in sdata) {
                let data = sdata[flag];
                if (!data.gain && !data.cost) {
                    continue;
                }
                fds.total += data.gain;
                fds.total -= data.cost;
                rd.push({
                    flag: flag,
                    data: data,
                });
                tags[flag] = 1;
            }
            rd.sort(function (a, b) {
                return a.data.timestamp > b.data.timestamp ? 1 : -1;
            });
            for (let i = 0; i < rd.length; i ++) {
                let temp = rd[i];
                this._write(funcName, uid, temp.data, temp.flag, fds.total);
            }
            this._try2GetField(field);
        }
    }

    /**
     * 轮询检查是否有需要写入的日志
     * @param {*轮询时间差，单位秒} dt 
     */
    checkWriteNow (dt) {
        let uid = this._uid;
        let logs = this._logs;
        for (let field in logs) {
            let fds = logs[field];
            let funcName = fds.funcName;
            let func = logBuilder[funcName];
            if (!func || typeof func !== 'function') {
                logger.error('checkWriteNow: no such function in logBuilder = ', funcName);
                continue;
            }
            
            let sdata = fds.sdata;
            for (let flag in sdata) {
                let data = sdata[flag];
                if (!data.gain && !data.cost) {
                    continue;
                }
                if (data.dt > 0) {
                    data.dt -= dt;
                    if (data.dt <= 0) {
                        fds.total += data.gain;
                        fds.total -= data.cost;
                        this._write(funcName, uid, data, flag, fds.total);
                    }
                }
            }
        }
    }

    /**
     * 尝试获取指定字段
     * @param {*} field 
     * @param {*} cb 
     */
    _try2GetField (field) {
        let log = this._logs[field];        
        let key = 'pair:uid:' + field;
        redisConnector.cmd.hget(key, this._uid, function (err, res) {
            if (!err && res) {
                let val = parseInt(res);
                logger.debug(' field = ', field, ' val = ', val);
                log.total = val;
            }
        });
    }

 }

 module.exports = FishingLog;