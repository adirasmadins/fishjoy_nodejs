module.exports = {
    /**
     * 游戏日志备份
     */

    logBackup: {
        enable: true,
        time: '0,0,*/1,*,*,*',
        subTask: [{
            table: 'tbl_gold_log',
            orderby: 'id',
            timeRangeColumn: 'log_at',
            structure: 'CREATE TABLE IF NOT EXISTS %s(' +
                'id bigint(20) NOT NULL AUTO_INCREMENT COMMENT \'自增ID\',' +
                'account_id bigint(20) NOT NULL COMMENT \'账户ID\',' +
                'log_at timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT \'记录日志的时间\',' +
                'gain int(11) NOT NULL DEFAULT \'0\' COMMENT \'获得金币数\', ' +
                'cost int(11) NOT NULL DEFAULT \'0\' COMMENT \'消费金币数\',' +
                'total int(11) DEFAULT \'0\' COMMENT \'玩家持有的金币总数，此字段需要和玩家当前持有金币信息进行验证\',' +
                'duration int(11) DEFAULT \'0\' COMMENT \'玩家距离上次更新时过了多长时间，单位为秒\',' +
                'scene int(11) DEFAULT NULL,' +
                'nickname tinyint(1) NOT NULL DEFAULT \'0\' COMMENT \'玩家是否为昵称账户的标识\', ' +
                'level int(11) NOT NULL DEFAULT \'1\' COMMENT \'玩家当前等级\',' +
                'fire bigint(20) NOT NULL DEFAULT \'0\' COMMENT \'开炮数\',' +
                'PRIMARY KEY (`id`)' +
                ')ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8',
            retain: 0,
            bak: 2000000,
            limit: 20000,
            daily: true,
            dailyTime: 1
        },
        {
            table: 'tbl_item_log',
            orderby: 'id',
            timeRangeColumn: 'log_at',
            structure: `CREATE TABLE IF NOT EXISTS %s(` +
                `id bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'ID',` +
                `account_id bigint(20) NOT NULL DEFAULT '0' COMMENT 'User ID',` +
                `log_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录日志时间',` +
                `itemId varchar(8) NOT NULL COMMENT '物品ID',` +
                `delta int(11) NOT NULL DEFAULT '0' COMMENT '物品增量(可为负数)',` +
                `left int(11) NOT NULL DEFAULT '0' COMMENT '玩家剩余物品总量',` +
                `scene int(11) NOT NULL DEFAULT '0' COMMENT '在什么场景下物品数量发生改变',` +
                `playerLevel int(11) NOT NULL DEFAULT '0' COMMENT '玩家记录日志时的等级',` +
                `PRIMARY KEY (id),` +
                `INDEX (log_at, itemId, scene)` +
                `)ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8`,
            retain: 0,
            bak: 2000000,
            limit: 20000,
            daily: true,
            dailyTime: 1
        }
        ]
    },

    /**
     * 游戏日志清理
     */
    logRemove: {
        enable: true,
        time: '0,0,3,*/1,*,*',
        subTask: [{
            table: 'tbl_gold_log',
            expiryTime: 30, //单位：天
        }, {
            table: 'tbl_item_log',
            expiryTime: 30, //单位：天
        }]
    }
};