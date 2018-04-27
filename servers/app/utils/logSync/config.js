/**
 * 公共任务配置
 * @type {{logInsert: {enable: boolean, time: string, writeLimit: number}}}
 */

module.exports = {
    /**
     * 日志批量写入
     * 支持mysql 和 redis
     */
    logInsert: {
        enable: true,
        time: '*/5,*,*,*,*,*',
        writeLimit: 100,
    },
    /**
     * 捕鱼日志备份
     */
    logBackup: {
        enable:false,
        time: '0,8,14,*,*,*',
        subTask: [
            {
                table: 'tbl_gold_log',
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
                'PRIMARY KEY (`id`)' +
                ')ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8',
                retain: 1000, bak: 400, max_bak_file: 3
            },
            {
                table: 'tbl_link_log',
                structure: 'CREATE TABLE IF NOT EXISTS %s(' +
                'id bigint(20) NOT NULL AUTO_INCREMENT COMMENT \'自增ID\',' +
                'uid bigint(20) NOT NULL COMMENT \'用户ID, 用户调用任意API都会记录到这个表\',' +
                'linked_at timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT \'记录的时间戳，由批量写入主动更新\',' +
                'api int(11) NOT NULL COMMENT \'调用API, 需要一个对应表来转换\', ' +
                'PRIMARY KEY (`id`)' +
                ')ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8',
                retain: 1000, "bak": 400, "max_bak_file": 3
            }
        ]
    }
};