//==============================================================================
// 配置信息
//==============================================================================
exports.app_cfg = {
    APP_NAME: 'sdk4sp',
    APP_PATH: '/sdk4sp'
};

exports.debug_cfg = {
    FORCE_SAVE_GOLD_DATA: true,
    FORCE_SAVE_PEARL_DATA: true,
};

exports.vip_fill = [
    0,      // Not VIP
    0,      // VIP1
    0,      // VIP2
    10000,  // VIP3
    20000,  // VIP4
    30000,  // VIP5
    40000,  // VIP6
    50000,  // VIP7
    100000, // VIP8
    200000, // VIP9
    300000, // VIP10
];

exports.weapon_levelup_type = {
    EXP: 0,      // level up with exp
    PEARL: 1     // level up with pearl
};
exports.shop_item_type = {
    IT_GIFT: 0,    //--商品礼包 
    IT_GOLD: 1,    //--商品金币
    IT_PEARL: 2,   //--商品珍珠 
    IT_VIP: 3,     //--商品vip
};
