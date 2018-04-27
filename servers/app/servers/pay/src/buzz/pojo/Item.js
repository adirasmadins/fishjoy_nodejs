const item_item_cfg = require('../../../../../utils/imports').DESIGN_CFG;

const ItemType = {
    GOLD:   1,
    PEARL:  2,
    SKILL:  3,
    DEBRIS: 4,
    SPECIAL: 5,
    GIFT:   7,
    MIX:    8,
    TOKENS: 9,
    CHANGE_FARE: 10,
    CHANGE_PHONE: 11,
    SKIN: 12,
    SKIN_DEBRIS:13
};
exports.ItemType = ItemType;

const ItemTypeC = {
    GOLD: "1",
    PEARL: "2",
    SKILL: "3",
    DEBRIS: "4",
    /** 特殊: 活跃值, 成就点 */
    SPECIAL: "5",
    MINIGAME: "6",
    GIFT: "7",
    MIX: "8",
    TOKENS: "9",
    CHANGE_FARE: "10",
    CHANGE_PHONE: "11",
    SKIN: '12',
    SKIN_DEBRIS:'13'
};
exports.ItemTypeC = ItemTypeC;

exports.Item = Item;// 物品对象

/**
 * id 物品ID.
 */
function Item(id) {
    // ---- 储存原始物品ID
    this.id = id;
    
    // ---- 储存解析后的奖励
    this.type = 0;    // 物品ID, 具体含义参考ItemType
    
    // ---- 解析物品
    for (let i in item_item_cfg) {
        let item = item_item_cfg[i];
        if (item.id == this.id) {
            this.type = item.type;
            break;
        }
    }
}