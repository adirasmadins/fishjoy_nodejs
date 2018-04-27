-- ----------------------------
-- Table structure for tbl_stat_hour_gold
-- ----------------------------
DROP TABLE IF EXISTS `tbl_stat_hour_gold`;
CREATE TABLE `tbl_stat_hour_gold` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `time` timestamp NULL COMMENT '统计数据的目标时间',
  `totalGain` bigint(20) NOT NULL DEFAULT '0' COMMENT '一个小时的金币获取总量',
  `totalCost` bigint(20) NOT NULL DEFAULT '0' COMMENT '一个小时的金币消耗总量',
  -- 消耗
  `cash` bigint(20) NOT NULL DEFAULT '0' COMMENT '一个小时的提现消耗总量',
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
  -- 获取
  `topup` bigint(20) NOT NULL DEFAULT '0' COMMENT '一个小时的充值获取总量',
  `gift` bigint(20) NOT NULL DEFAULT '0' COMMENT '一个小时的限时礼包充值获取总量',
  `fishingWin` bigint(20) NOT NULL DEFAULT '0' COMMENT '一个小时的捕鱼获取总量',
  `nuclearGain` bigint(20) NOT NULL DEFAULT '0' COMMENT '一个小时的核弹获取总量',
  `activeGain` bigint(20) NOT NULL DEFAULT '0' COMMENT '一个小时的活动获取总量',
  `mail` bigint(20) NOT NULL DEFAULT '0' COMMENT '一个小时的邮件领奖总量',
  `benefit` bigint(20) NOT NULL DEFAULT '0' COMMENT '一个小时的救济金领取总量',
  `monthCard` bigint(20) NOT NULL DEFAULT '0' COMMENT '一个小时的月卡获取总量',
  `firstTopup` bigint(20) NOT NULL DEFAULT '0' COMMENT '一个小时的首充获取总量',
  `drawGain` bigint(20) NOT NULL DEFAULT '0' COMMENT '一个小时的活动抽奖获取总量',
  `goldenFish` bigint(20) NOT NULL DEFAULT '0' COMMENT '一个小时的奖金鱼转盘获取总量',
  `fire` bigint(20) NOT NULL DEFAULT '0' COMMENT '一个小时内的开火数',
  PRIMARY KEY (`id`),
  INDEX (`time`)
) ENGINE=NDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

ALTER TABLE `tbl_stat_hour_gold` CHANGE `other` `otherCost` bigint(20) NOT NULL DEFAULT '0' COMMENT '一个小时的其他消耗总量'
ALTER TABLE `tbl_stat_hour_gold` ADD `mail` bigint(20) NOT NULL DEFAULT '0' COMMENT '一个小时的邮件领奖总量'
ALTER TABLE `tbl_stat_hour_gold` ADD `fire` bigint(20) NOT NULL DEFAULT '0' COMMENT '一个小时内的开火数'
ALTER TABLE `tbl_stat_hour_gold` ADD INDEX ( `time` )
