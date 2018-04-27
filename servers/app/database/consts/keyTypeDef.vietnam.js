/**
 * 玩家信息字段及默认值，以下数据从数据库导出所得
 * TODO: 表过于臃肿，待拆分:女神数据，凡是单个字段
 */

module.exports.AccountDef = {
    "player_catch_rate": {
        "def": 1,
        "type": "number"
    },
    "recharge": {
        "def": 0,
        "type": "number",
        "inc": true
    },
    "cash": {
        "def": 0,
        "type": "number",
        "inc": true
    },
    "cost": {
        "def": 0,
        "type": "number",
        "inc": true
    },
    "gain_loss": {
        "def": 0,
        "type": "float"
    },
    "gain_loss_limit": {
        "def": 0,
        "type": "number"
    },
    "gain_loss_snapshot": {
        "def": 0,
        "type": "float"
    },
    "privacy": {
        "def": 1,
        "type": "number"
    },
};

//注意，其他字段来自其他表，参考common的_resultList方法实现
module.exports.OtherDef = {
};