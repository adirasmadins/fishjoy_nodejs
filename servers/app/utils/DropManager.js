/**
 * 掉落辅助
 * 打鱼掉落、开宝箱
 * 掉落所得将放入用户数据和redis，不再操作sql
 */

const DateUtil = require('./DateUtil');
const gameConfig = require('./imports').DESIGN_CFG;
const REDISKEY = require('../database').dbConsts.REDISKEY;
const configReader = require('./configReader');

const DROP_LIST = gameConfig.drop_droplist_cfg;
const DROP_ITEM = gameConfig.drop_drop_cfg;
const ITEM_ITEM = gameConfig.item_item_cfg;

const DP = 100000;

class DropManager {
    constructor () {
        this._glDrop = {}; 

        this._glDrop[REDISKEY.LOG.G_DAY_DROP] = {
            isChange: false,
            data: {},
        };//全服每天掉落,跨天重置
        
        this._glDrop[REDISKEY.LOG.G_HOUR_DROP] = {
            isChange: false,
            data: {},
        };//全服每小时掉落，跨小时重置
    }

     /**
     * 重新加载数据到内存\监听重置事件
     */
    start () {
        for (let k in this._glDrop) {
            this._reloadByType(k);
        }
        this._listen();
    }

    /**
     * 监听重置事件
     */
   _listen () {
        redisConnector.sub(REDISKEY.CH.DROP_RELOAD, function (data) {
            this._reloadByType(data.typeKey);
        }.bind(this));
    }

    /**
     * 按类型重置
     * @param {*类型key} typeKey 
     */
    _reloadByType (typeKey) {
        let temp = this._glDrop[typeKey];
        redisConnector.cmd.get(typeKey, function (err, res) {
            if (err || !res) {
                temp.data = {};
            }else {
                temp.data = JSON.parse(res);
            }
        });
    }

    /**
     * 持久化
     */
    _save () {
        for (let k in this._glDrop) {
            let temp = this._glDrop[k];
            if (temp.isChange) {
                let val = JSON.stringify(temp.data);
                redisConnector.cmd.set(k, val);
                temp.isChange = false;
            }
        }
    }

    /**
     * 开宝箱（通过宝箱数据查找掉落数据尝试掉落）
     * @param {*玩家数据} account 
     * @param {*宝箱id} treasureId 
     * @param {*掉落场景} sFlag 
     * @param {*单个道具加成倍率，默认1} itemTimes 
     * @param {*掉落次数加成，默认0} dropAdditionalTimes 
     */
    openTreasure (account, treasureId, sFlag, itemTimes, dropAdditionalTimes) {
        dropAdditionalTimes = dropAdditionalTimes || 0;
        let treasure = configReader.getValue('treasure_treasure_cfg', treasureId);
        if (!treasure) {
            logger.error('treasureId = ', treasureId);
        }
        let dc = dropAdditionalTimes + treasure.dropcount;
        return this.try2Drop(account, treasure.dropid, dc, sFlag, itemTimes);
    }

    /**
     * 尝试掉落
     * @param {*玩家数据} account 
     * @param {*掉落key，来自掉落列表} dlKey 
     * @param {*掉落数量，默认1} dropCount 
     * @param {*掉落场景} sFlag 
     * @param {*单个道具加成倍率，默认1} itemTimes 
     */
    try2Drop (account, dlKey, dropCount, sFlag, itemTimes) {
        dropCount = dropCount || 1;
        itemTimes = itemTimes || 1;
        sFlag = sFlag || 1;
        let dropOnce = account.drop_once || {};
        let dropReset = account.drop_reset || {};
        let dpks = [];
        let okC = 0;
        let logItems = [];
        let onceC = 0;
        let resetC = 0;
        for (let i = 0; i < dropCount; i ++) {
            let res = this._dropWhat(dropOnce, dropReset, dlKey);
            if (res) {
                let len = res.length;
                while (len > 0 && len --) {
                    let temp = res[len];
                    let dpKey = temp.dpKey;
                    let DROP = DROP_ITEM[dpKey];
                    let ret = temp.ret;
                    if (ret.isCounting) {
                        let rt = DROP.reset;
                        if (rt === 0) {
                            dropOnce[dpKey] = dropOnce[dpKey] || 0;
                            dropOnce[dpKey] ++; 
                            okC = 1;
                            onceC ++;
                        }else if (rt === 1) {
                            dropReset[dpKey] = dropReset[dpKey] || 0;
                            dropReset[dpKey] ++; 
                            okC = 2;
                            resetC ++;
                        }
                    }
                    if (ret.isOk) {
                        let num = Math.floor(DROP.item_num * itemTimes);
                        let itemId = DROP.item_id;
                        if (this._putIntoPackage(itemId, num, account)) {
                            logItems.push({
                                item_id: itemId,
                                item_num: num,
                            });
                            logger.info('成功放入背包 = ', itemId, ' DROP.item_num = ', num, ' itemTimes = ', itemTimes);
                            okC = 3;
                        }
                        dpks.push(dpKey);
                    }
                }
            }
        }
        if (okC > 0) {
            onceC > 0 && (account.drop_once = dropOnce);
            resetC > 0 && (account.drop_reset = dropReset);
            account.commit();
            this._save();
        }
        logItems.length > 0 && logBuilder.addGoldAndItemLog(logItems, account, sFlag);

        return {
            dpks: dpks,
            logItems: logItems,
        };
    }

    /**
     * 放入背包
     * @param {*道具id} itemKey 
     * @param {*道具数量} itemNum 
     * @param {*玩家} account 
     */
    _putIntoPackage (itemKey, itemNum, account) {
        let itemCfg = ITEM_ITEM[itemKey];
        if (itemCfg && itemNum > 0) {
            let type = itemCfg.type;
            if (type == 1) {
                account.gold = itemNum; //注意增量
                return true;
            }else if (type == 2) {
                account.pearl = itemNum; //注意增量
                return true;
            }else if (type == 3) {
                let skillID = itemCfg.id;
                let skill = account.skill || {};
                if (!skill[skillID]) {
                    skill[skillID] = 0;
                }
                skill[skillID] += itemNum;
                account.skill = skill;
                return true;
            }else {
                let pack = account.package || {};
                if (!pack[type]) {
                    pack[type] = {};
                }
                if (!pack[type][itemKey]) {
                    pack[type][itemKey] = 0;
                }
                pack[type][itemKey] += itemNum;
                account.package = pack;
                return true;
            }
        }
        return false;
    }

    /**
     * 掉什么
     */
    _dropWhat (dropOnce, dropReset, dlKey) {
        if (!DROP_LIST || !DROP_ITEM) {
            return null;
        }
        let temp = DROP_LIST[dlKey];
        if (!temp) {
            return null;
        }
        let tp = temp.probability;
        let len = tp.length;
        if (len === 0 || temp.drop_id.length !== len) {
            logger.error('debug test cfg is error = ', dlKey);
            return null;
        }
        let total = 0;
        let i = 0;
        for (; i < len; i ++) {
            total += tp[i];
        }
        let rv = Math.floor(Math.random() * total);
        i = 0;
        total = 0;
        let dpks = [];
        for (; i < len; i ++) {
            total += tp[i];
            if (total >= rv) {
                dpks = temp.drop_id[i];
                break;
            }
        }
        if (!dpks.length) {
            return null;
        }
        len = dpks.length;
        i = 0;
        let doneKeys = [];
        for (; i < len; i ++) {
            let dpKey = dpks[i];
            let ret = this._dropOrNot(dpKey, dropOnce[dpKey], dropReset[dpKey]);
            doneKeys.push({
                dpKey: dpKey,
                ret: ret,
            });
        }
        return doneKeys;
    }


    /**
     * 单个掉落与否
     * @param {*掉落key} dpKey 
     * @param {*玩家这个key掉落次数，不重置} dropOnce 
     * @param {*玩家这个key掉落次数，重置} dropReset 
     */
      _dropOrNot (dpKey, dropOnce, dropReset) {
        let ret = {
            isCounting: false, 
            isOk: false,
        };

        let temp = DROP_ITEM[dpKey];
        if (!temp) {
            return ret;
        }
        let tps = temp.item_probability;
        let lt = temp.limit_type;
        let lc = temp.limit_count;
        let rt = temp.reset;
        let lcLen = lc.length;
        let len = tps.length;
        ret.isCounting = len > 1; //多个掉落概率才记录掉落次数，反之不记录；注意未成功掉落也得记录次数
        dropOnce =  dropOnce || 0;
        dropReset = dropReset || 0;
        let adpC = rt === 0 ? dropOnce : dropReset;
        if (len === 1) {
            adpC = 0;
        }else if (adpC >= len) {
            adpC = len - 1;
        }
        if (lt === 1 && lcLen === 1) {
            let rv = Math.floor(Math.random() * DP);
            if (rv < tps[adpC]) {
                let todayC = lc[0];
                if (todayC > 0) {
                    let gd = this._glDrop[REDISKEY.LOG.G_DAY_DROP];
                    let gdc = gd.data[dpKey] || 0;
                    if (gdc >= todayC) {
                        return ret;
                    }
                    gd.data[dpKey] = gdc + 1;
                    gd.isChange = true;
                }
                ret.isOk = true;
                return ret;
            }
        }else if (lt === 2 && lcLen === 24) {
            let hIdx = Math.max(0, DateUtil.getHourIdx() - 1);
            let htc = lc[hIdx];
            let gh = this._glDrop[REDISKEY.LOG.G_HOUR_DROP];
            let ghc = gh.data[dpKey] || 0;
            if (ghc >= htc) {
                return ret;
            }
            let rv = Math.floor(Math.random() * DP);
            if (rv < tps[adpC]) {
                gh.data[dpKey] = ghc + 1;
                gh.isChange = true;
                ret.isOk = true;
                return ret;
            }
        }
        return ret;
      }

}

module.exports = new DropManager();