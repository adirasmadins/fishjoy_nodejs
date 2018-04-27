-- ----------------------------
-- Table structure for tbl_item_log
-- ----------------------------
-- DROP TABLE IF EXISTS `tbl_item_log`;
CREATE TABLE IF NOT EXISTS `tbl_item_log` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `account_id` bigint(20) NOT NULL COMMENT '账户ID',
  `log_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录日志时间',
  `itemId` varchar(8) NOT NULL COMMENT '物品ID',
  `delta` int(11) NOT NULL DEFAULT '0' COMMENT '物品增量(可为负数)',
  `left` int(11) NOT NULL DEFAULT '0' COMMENT '玩家剩余物品总量',
  `scene` int(11) NOT NULL DEFAULT '0' COMMENT '在什么场景下物品数量发生改变',
  `playerLevel` int(11) NOT NULL DEFAULT '0' COMMENT '玩家记录日志时的等级',
  PRIMARY KEY (`id`),
  INDEX (`log_at`,`itemId`,`scene`)
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for tbl_activity_log
-- ----------------------------
-- DROP TABLE IF EXISTS `tbl_activity_log`;
CREATE TABLE IF NOT EXISTS `tbl_activity_log` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `log_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录时间',
  `account_id` bigint(20) NOT NULL COMMENT '玩家ID',
  `itemId` varchar(8) NOT NULL COMMENT '物品ID',
  `itemNum` int(11) NOT NULL DEFAULT '0' COMMENT '物品数量',
  `itemTotal` int(11) NOT NULL DEFAULT '0' COMMENT '玩家持有该物品总量',
  `activityName` text NOT NULL COMMENT '活动名称',
  `missionId` int(11) NOT NULL COMMENT '任务ID',
  PRIMARY KEY (`id`),
  INDEX (`log_at`,`itemId`)
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;

-- ----------------------------
-- 2018-03-26
-- YXL: Add new field for daily statistics
-- ----------------------------
ALTER TABLE `tbl_stat_day` ADD `r3` float NOT NULL DEFAULT '0' COMMENT '三日留存率';
ALTER TABLE `tbl_stat_day` ADD `r14` float NOT NULL DEFAULT '0' COMMENT '14日留存率';
ALTER TABLE `tbl_stat_day` ADD `cash_count` int(11) NOT NULL DEFAULT '0' COMMENT '提现次数';
ALTER TABLE `tbl_stat_day` ADD `cash_account` int(11) NOT NULL DEFAULT '0' COMMENT '提现用户数';
ALTER TABLE `tbl_stat_day` ADD `cash_vnd_sum` bigint(20) NOT NULL DEFAULT '0' COMMENT '提现金额(越南盾)';
ALTER TABLE `tbl_stat_day` ADD `cash_vnd_avg` bigint(20) NOT NULL DEFAULT '0' COMMENT '人均提现额';

ALTER TABLE `tbl_order` ADD `goods_name` varchar(64) DEFAULT NULL COMMENT '商品名称';
ALTER TABLE `tbl_order` ADD `card_serial` varchar(64) DEFAULT NULL COMMENT '电话卡密';
ALTER TABLE `tbl_order` ADD `card_code` varchar(64) DEFAULT NULL COMMENT '电话卡号';

