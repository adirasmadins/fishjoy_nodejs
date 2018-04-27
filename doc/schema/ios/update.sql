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

-- ----------------------------
-- 2018-03-29
-- YXL: Add new table tbl_stat_hour_gold
-- ----------------------------
CREATE TABLE `tbl_stat_hour_gold` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `time` timestamp NULL DEFAULT NULL COMMENT '统计数据的目标时间',
  `totalGain` bigint(20) NOT NULL DEFAULT '0' COMMENT '一个小时的金币获取总量',
  `totalCost` bigint(20) NOT NULL DEFAULT '0' COMMENT '一个小时的金币消耗总量',
  `cash` bigint(20) NOT NULL DEFAULT '0' COMMENT '一个小时的提现消耗总量',
  `fishingCost` bigint(20) NOT NULL DEFAULT '0' COMMENT '一个小时捕鱼消耗的金币',
  `buySkin` bigint(20) NOT NULL DEFAULT '0' COMMENT '一个小时的购买皮肤消耗总量',
  `buySkill` bigint(20) NOT NULL DEFAULT '0' COMMENT '一个小时的购买技能消耗总量',
  `buyNuclear` bigint(20) NOT NULL DEFAULT '0' COMMENT '一个小时的核弹消耗总量',
  `activeCost` bigint(20) NOT NULL DEFAULT '0' COMMENT '一个小时的活动消耗总量',
  `buyRuby` bigint(20) NOT NULL DEFAULT '0' COMMENT '一个小时的购买钻石消耗总量',
  `buyCard` bigint(20) NOT NULL DEFAULT '0' COMMENT '一个小时的购买月卡小消耗总量',
  `buyVipGift` bigint(20) NOT NULL DEFAULT '0' COMMENT '一个小时的购买VIP礼包总量',
  `give` bigint(20) NOT NULL DEFAULT '0' COMMENT '一个小时的赠予消耗总量',
  `drawCost` bigint(20) NOT NULL DEFAULT '0' COMMENT '一个小时的活动抽奖消耗总量',
  `otherCost` bigint(20) NOT NULL DEFAULT '0' COMMENT '一个小时的其他消耗总量',
  `topup` bigint(20) NOT NULL DEFAULT '0' COMMENT '一个小时的充值获取总量',
  `gift` bigint(20) NOT NULL DEFAULT '0' COMMENT '一个小时的限时礼包充值获取总量',
  `fishingWin` bigint(20) NOT NULL DEFAULT '0' COMMENT '一个小时的捕鱼获取总量',
  `nuclearGain` bigint(20) NOT NULL DEFAULT '0' COMMENT '一个小时的核弹获取总量',
  `activeGain` bigint(20) NOT NULL DEFAULT '0' COMMENT '一个小时的活动获取总量',
  `benefit` bigint(20) NOT NULL DEFAULT '0' COMMENT '一个小时的救济金领取总量',
  `monthCard` bigint(20) NOT NULL DEFAULT '0' COMMENT '一个小时的月卡获取总量',
  `firstTopup` bigint(20) NOT NULL DEFAULT '0' COMMENT '一个小时的首充获取总量',
  `drawGain` bigint(20) NOT NULL DEFAULT '0' COMMENT '一个小时的活动抽奖获取总量',
  `goldenFish` bigint(20) NOT NULL DEFAULT '0' COMMENT '一个小时的奖金鱼转盘获取总量',
  `fire` bigint(20) NOT NULL DEFAULT '0' COMMENT '一个小时内的开火数',
  PRIMARY KEY (`id`),
  KEY `time` (`time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- 2018-03-29
-- YXL: Add new field for tbl_stat_hour
-- ----------------------------
ALTER TABLE `tbl_stat_hour` ADD `activeDevice` int(11) NOT NULL DEFAULT '0' COMMENT '上一个小时活跃设备数';
ALTER TABLE `tbl_stat_hour` ADD `newDevice` int(11) NOT NULL DEFAULT '0' COMMENT '上一个小时新增设备数';
ALTER TABLE `tbl_stat_hour` ADD `o1` int(11) NOT NULL DEFAULT '0' COMMENT '0~10';
ALTER TABLE `tbl_stat_hour` ADD `o2` int(11) NOT NULL DEFAULT '0' COMMENT '11~20';
ALTER TABLE `tbl_stat_hour` ADD `o3` int(11) NOT NULL DEFAULT '0' COMMENT '21~30';
ALTER TABLE `tbl_stat_hour` ADD `o4` int(11) NOT NULL DEFAULT '0' COMMENT '31~40';
ALTER TABLE `tbl_stat_hour` ADD `o5` int(11) NOT NULL DEFAULT '0' COMMENT '41~50';
ALTER TABLE `tbl_stat_hour` ADD `o6` int(11) NOT NULL DEFAULT '0' COMMENT '51~60';

ALTER TABLE `tbl_order` ADD `goods_name` varchar(64) NOT NULL DEFAULT NULL COMMENT '商品名称';
