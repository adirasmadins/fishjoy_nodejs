alter table `tbl_stat_hour` ADD `activeDevice` int(11) NOT NULL DEFAULT '0' COMMENT '上一个小时活跃设备数';
alter table `tbl_stat_hour` ADD `newDevice` int(11) NOT NULL DEFAULT '0' COMMENT '上一个小时新增设备数';
alter table `tbl_order` ADD `goods_name` varchar(64) DEFAULT NULL COMMENT '商品名称';
alter table `tbl_order` ADD `goods_name` varchar(64) DEFAULT NULL COMMENT '商品名称';

alter table `tbl_order` ADD `item_type` tinyint(4) DEFAULT '0' COMMENT '购买的商品类型(0-钻石，1-金币)';
alter table `tbl_order` ADD `item_list` text COMMENT '购买成功添加的物品';

alter table `tbl_cd_key` MODIFY `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建CD-KEY的时间';


-- ----------------------------
-- 2018-04-02
-- YXL: Add tbl_goddess_log
-- ----------------------------
-- ----------------------------
-- Table structure for tbl_goddess_log
-- ----------------------------
CREATE TABLE IF NOT EXISTS `tbl_goddess_log` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '自增ID',
  `log_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录时间',
  `account_id` bigint(20) NOT NULL COMMENT '玩家ID',
  `wave` int(11) NOT NULL DEFAULT '0' COMMENT '当前波数',
  `type` int(11) NOT NULL DEFAULT '0' COMMENT '1-进入,2-过关,3-结算',
  PRIMARY KEY (`id`),
  INDEX (`log_at`,`account_id`)
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;


-- ----------------------------
-- 2018-05-09
-- YXL: Add field for account
-- ----------------------------
CREATE TABLE `tbl_mission` (
  `id` bigint(20) NOT NULL COMMENT '用户id',
  `mission_task_once` TEXT COMMENT '用户一次性任务进度，仅踢人时更新',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;