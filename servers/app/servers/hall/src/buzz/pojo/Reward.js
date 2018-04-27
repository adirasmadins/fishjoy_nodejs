const ItemType = require('./Item').ItemType;
const item_item_cfg = require('../../../../../utils/imports').DESIGN_CFG.item_item_cfg;

let ERROR = 1;
let DEBUG = 0;

const IDX_ID = 0;
const IDX_NUM = 1;


//==============================================================================
// public
//==============================================================================

//------------------------------------------------------------------------------
// definition
//------------------------------------------------------------------------------
module.exports = Reward;// 奖励对象

//------------------------------------------------------------------------------
// implement
//------------------------------------------------------------------------------
//----------------------------------------------------------
// Reward
//----------------------------------------------------------
/**
 * 初始化话获得的奖励, 转换ID(特别是skill)
 * @param list 数组对象, 奖励配置.
 */
function Reward(list) {
    // ---- 储存原始奖励字段
    this.list = list;
    
    // ---- 储存解析后的奖励
    this.gold = 0;      // 金币
    this.pearl = 0;     // 钻石
    this.active_point = 0;   // 活跃值
    this.achieve_point = 0;   // 成就点
    this.gift = {};     // 礼包
    this.debris = {};   // 碎片
    this.tokens = {};   // 代币
    this.skin = {};     // 武器皮肤(获取新皮肤或转换为对应皮肤的碎片)
    this.skin_debris = {};   // 武器皮肤的碎片
    this.mix = {};      // 合成道具
    
    // ---- 解析奖励
    for (let i in this.list) {
        let item = this.list[i];
        
        let item_id = item[IDX_ID];
        let itemInfo = item_item_cfg[item_id];

        if (DEBUG) logger.info("i:", i);
        if (DEBUG) logger.info("item:", item);
        if (DEBUG) logger.info("item_id:", item_id);
        if (DEBUG) logger.info("itemInfo:", itemInfo);

        if (itemInfo) {
            if (DEBUG) logger.info("item_type:", itemInfo.type);
            switch (itemInfo.type) {
                case ItemType.GOLD:
                    this.gold = this.gold + item[IDX_NUM];
                    break;

                case ItemType.PEARL:
                    this.pearl = this.pearl + item[IDX_NUM];
                    break;

                case ItemType.SPECIAL:
                    if ("i102" == item_id) {
                        logger.info("获得了活跃值-item_id:", item_id);
                        this.active_point = this.active_point + item[IDX_NUM];
                    }
                    if ("i103" == item_id) {
                        logger.info("获得了成就点-item_id:", item_id);
                        this.achieve_point = this.achieve_point + item[IDX_NUM];
                    }
                    break;

                case ItemType.SKILL:
                    this.skill = {};    // 技能
                    createOrAdd(this.skill, "" + itemInfo.id, item[IDX_NUM]);
                    break;

                case ItemType.GIFT:
                    createOrAdd(this.gift, item_id, item[IDX_NUM]);
                    break;

                case ItemType.DEBRIS:
                    createOrAdd(this.debris, item_id, item[IDX_NUM]);
                    break;

                case ItemType.TOKENS:
                    createOrAdd(this.tokens, item_id, item[IDX_NUM]);
                    break;

                case ItemType.MIX:
                    createOrAdd(this.mix, item_id, item[IDX_NUM]);
                    break;

                case ItemType.SKIN:
                    createOrAdd(this.skin, item_id, item[IDX_NUM]);
                    break;

                case ItemType.SKIN_DEBRIS:
                    createOrAdd(this.skin_debris, item_id, item[IDX_NUM]);
                    break;
            }
        }
        else {
            if (ERROR) logger.error("错误的物品, 物品信息如下:");
            if (ERROR) logger.error("----item:", item);
            if (ERROR) logger.error("----item_id:", item_id);
            if (ERROR) logger.error("----itemInfo:", itemInfo);
        }
    }
}

/**
 * 验证对象obj是否包含某个属性key, 没有则创建并赋值num, 有的话则在原值上加num.
 * @param obj 操作对象.
 * @param key 验证的属性名.
 * @param num 属性的加值.
 */
function createOrAdd(obj, key, num) {
    if (obj[key] == null) {
        obj[key] = num;
    }
    else {
        obj[key] = obj[key] + num;
    }
}