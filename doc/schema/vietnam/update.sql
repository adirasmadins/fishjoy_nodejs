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
  `itemId` text NULL COMMENT '物品ID',
  `itemNum` int(11) NOT NULL DEFAULT '0' COMMENT '物品数量',
  `itemTotal` int(11) NOT NULL DEFAULT '0' COMMENT '玩家持有该物品总量',
  `activityName` text NOT NULL COMMENT '活动名称',
  `missionId` int(11) NOT NULL COMMENT '任务ID',
  PRIMARY KEY (`id`),
  INDEX (`log_at`)
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;

-- ----------------------------
-- 2018-03-29
-- update
-- ----------------------------
alter table `tbl_stat_hour` ADD `online_count` int(11) NOT NULL DEFAULT '0' COMMENT '上一个小时在线用户数';

ALTER TABLE `tbl_stat_day` CHANGE `new_nickname_account` `new_account` int(11) NOT NULL DEFAULT '0' COMMENT '当日新增账户计数';
ALTER TABLE `tbl_stat_day` CHANGE `temp_login` `login_count` int(11) NOT NULL DEFAULT '0' COMMENT '当日登录次数';
ALTER TABLE `tbl_stat_day` CHANGE `temp_count` `active_count` int(11) NOT NULL DEFAULT '0' COMMENT '当日活跃账户计数';

ALTER TABLE `tbl_stat_day` DROP `new_temp_account`;
ALTER TABLE `tbl_stat_day` DROP `new_bind_account`;
ALTER TABLE `tbl_stat_day` DROP `nickname_login`;
ALTER TABLE `tbl_stat_day` DROP `nickname_count`;

ALTER TABLE `tbl_stat_day` MODIFY `shop_pta` float NOT NULL DEFAULT '0' COMMENT '充值人数比活跃账号数( Pay To Active )';
ALTER TABLE `tbl_stat_day` MODIFY `shop_arpu` float NOT NULL DEFAULT '0' COMMENT '充值金额比活跃人数';
ALTER TABLE `tbl_stat_day` MODIFY `shop_arrpu` float NOT NULL DEFAULT '0' COMMENT '充值金额比充值人数';

ALTER TABLE `tbl_stat_day` ADD `avgHourOnline` int(11) NOT NULL DEFAULT '0' COMMENT '平均每小时在线';
ALTER TABLE `tbl_stat_day` ADD `maxHourOnline` int(11) NOT NULL DEFAULT '0' COMMENT '当日最高在线';

ALTER TABLE `tbl_stat_day` ADD `r3` float NOT NULL DEFAULT '0' COMMENT '三日留存率';
ALTER TABLE `tbl_stat_day` ADD `r14` float NOT NULL DEFAULT '0' COMMENT '14日留存率';

ALTER TABLE `tbl_order` ADD `goods_name` varchar(64) NOT NULL DEFAULT NULL COMMENT '商品名称';


 ALTER TABLE `tbl_stat_hour` ADD `activeDevice` int(11) NOT NULL DEFAULT '0' COMMENT '上一个小时活跃设备数';

