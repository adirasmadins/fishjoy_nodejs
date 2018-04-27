module.exports = {

    TYPE: {
        LOGIN: 0,
        LOGOUT: 1,
        PEARL: 2,
        RANK_GAME: 3,
        SHOP: 4,
        SKILL: 5,
        WEAPON: 6,
        AI: 7,
        BIND: 8,
        CHANGE: 9,
        DROP: 10,
        EXP: 11,
        GOLD: 12,
        LINK: 13,
        HUAFEI: 14,
        ITEM: 15,
        ACTIVITY: 16,
        GODDESS: 17
    },

    TABLE: {
        0: {
            name: 'tbl_login_log',
            field: ['account_id', 'log_at', 'nickname', 'deviceId', 'ip'],
        },
        1: {
            name: 'tbl_logout_log',
            field: ['account_id', 'log_at', 'nickname'],
        },
        2: {
            name: 'tbl_pearl_log',
            field: ['account_id', 'log_at', 'gain', 'cost', 'total', 'scene', 'nickname'],
        },
        3: {
            name: 'tbl_rankgame_log',
            field: [`time`, `player1`, `wait_time1`, `rank1`, `bullet_score1`, `used_bullet1`, `nuclear_score1`, `nuclear_exploded1`, `player2`, `wait_time2`, `rank2`, `bullet_score2`, `used_bullet2`, `nuclear_score2`, `nuclear_exploded2`, `result`],
        },
        4: {
            name: 'tbl_shop_log',
            field: ['account_id', 'log_at', 'item_id', 'item_type', 'item_amount', 'nickname', 'price', 'order_id'],
        },
        5: {
            name: 'tbl_skill_log',
            field: ['account_id', 'skill_id', 'gain', 'cost', 'total', 'log_at', 'nickname'],
        },
        6: {
            name: 'tbl_weapon_log',
            field: ['account_id', 'log_at', 'level', 'type', 'level_up', 'nickname', 'vip_weapon_id'],
        },
        7: {
            name: 'tbl_ai_log',
            field: ['account_id', 'log_at', 'wpTimes', 'firstFireSeconds', 'noFireQuitChance', 'fishTimes', 'sameFishAverageDt', 'targetShiftTimes', 'normalStaySeconds', 'brokenStaySeconds', 'iceSkillTimes', 'lockSkillChance', 'callSkillTimes', 'holdChance', 'holdAverageSeconds', 'waitAverageSeconds', 'holdingQuitChance'],
        },
        8: {
            name: 'tbl_bind_log',
            field: ['account_id', 'nickname', 'log_at'],
        },
        9: {
            name: 'tbl_change_log',
            field: ['orderid', 'sn', 'uid', 'name', 'phone', 'address', 'created_at', 'ship_at', 'cid', 'catalog', 'count', 'cost', 'itemname', 'status', 'thingnum', 'way', 'card_num', 'card_pwd', 'icon'],
        },
        10: {
            name: 'tbl_drop_log',
            field: ['account_id', 'log_at', 'drop_key', 'times'],
        },
        11: {
            name: 'tbl_exp_log',
            field: ['account_id', 'added_exp', 'total_exp', 'duration'],
        },
        12: {
            name: 'tbl_gold_log',
            field: ['account_id', 'log_at', 'gain', 'cost', 'total', 'duration', 'scene', 'nickname', 'level', 'fire'],
        },
        13: {
            name: 'tbl_link_log',
            field: ['uid', 'linked_at', 'api'],
        },
        14: {
            name: 'tbl_huafei_log', 
            field: ['uid','gain','cost','total','scene','comment','time'],
        },
        15: {
            name:'tbl_item_log',
            field:['`account_id`','`log_at`','`itemId`','`delta`','`left`','`scene`','`playerLevel`']
        },
        16: {
            name:'tbl_activity_log',
            field:['`account_id`','`log_at`','`itemId`','`itemNum`','`itemTotal`','`activityName`','`missionId`']
        },
        17: {
            name:'tbl_goddess_log',
            field:['account_id','log_at','wave','`type`']
        }
    }

};