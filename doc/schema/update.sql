ALTER TABLE `tbl_account` ADD `vip_daily_reward` smallint(6) NOT NULL DEFAULT '0' COMMENT 'vip每日领取,0-未领,1-已领';
alter table tbl_account add recharge bigint;
alter table tbl_account add cash bigint;
alter table tbl_account add cost bigint;
alter table tbl_account add bonus_pool double;
alter table tbl_account add pump_pool double;
alter table tbl_account add gain_loss double;
alter table tbl_order  modify column channel varchar(24);


ALTER TABLE `tbl_social` MODIFY `share_status_0` text COMMENT '分享状态(不重复)';
ALTER TABLE `tbl_social` MODIFY `share_status_1` text COMMENT '分享状态(每日重复)';
ALTER TABLE `tbl_social` MODIFY `share_status_2` text COMMENT '分享状态(每周重复)';


-- ----------------------------
-- 2018-04-08
-- YXL: Add new field for device
-- ----------------------------
ALTER TABLE `tbl_account` ADD `device` text COMMENT '玩家注册账号时所使用的终端设备';
ALTER TABLE `tbl_stat_day` ADD `newDevice` int(11) NOT NULL DEFAULT '0' COMMENT '统计一天的新增设备数';
ALTER TABLE `tbl_stat_day` ADD `activeDevice` int(11) NOT NULL DEFAULT '0' COMMENT '统计一天的活跃设备数';
ALTER TABLE `tbl_login_log` ADD `deviceId` text COMMENT '玩家登录时的设备号';
ALTER TABLE `tbl_login_log` ADD `ip` text COMMENT '玩家登录时的IP';

-- ----------------------------
-- 2018-04-09
-- YXL: Add new field for mail
-- ----------------------------
ALTER TABLE `tbl_mail` ADD `receiver` int(11) NOT NULL DEFAULT '0' COMMENT '收件人总数';
ALTER TABLE `tbl_mail` ADD `received` int(11) NOT NULL DEFAULT '0' COMMENT '已收邮件人总数';
ALTER TABLE `tbl_mail` ADD `receiverUid` text COMMENT '所有收件人的UID';
ALTER TABLE `tbl_mail` ADD `receivedUid` text COMMENT '已收邮件玩家的UID';
ALTER TABLE `tbl_mail` ADD `addByWho` bigint(20) DEFAULT NULL COMMENT '发件人的ID(管理员才可发信)';
ALTER TABLE `tbl_mail` ADD `status` smallint(6) NOT NULL DEFAULT '1' COMMENT '邮件状态(0-取消,1-有效)';
ALTER TABLE `tbl_mail` ADD `validtime` timestamp NULL DEFAULT NULL COMMENT '生效时间';

-- ----------------------------
-- 2018-04-10
-- YXL: Add new field for cdkey
-- ----------------------------
ALTER TABLE `tbl_cd_key` ADD `usedUserInfo` text COMMENT '使用者信息[{uid:x,time:''2018-01-01 00:00:00''}...]';

-- ----------------------------
-- 2018-04-13
-- YXL: modify `other_data` field for tbl_login_log
-- ----------------------------
ALTER TABLE `tbl_login_log` MODIFY `other_data` text COMMENT '玩家登陆时由客户端传入的消息';
ALTER TABLE `tbl_login_log` ADD `other_data` text COMMENT '玩家登陆时由客户端传入的消息';
ALTER TABLE `tbl_login_log` ADD `level` int(11) NOT NULL DEFAULT '1' COMMENT '玩家登陆时的等级';

-- ----------------------------
-- 2018-04-18
-- DFC: Add new field for tbl_order
-- ----------------------------
ALTER TABLE `tbl_order` ADD `item_type` tinyint DEFAULT 0 COMMENT '购买的商品类型(0-钻石，1-金币)';

-- ----------------------------
-- 2018-04-19
-- YXL: modify tbl_item_log
-- ----------------------------
ALTER TABLE `tbl_item_log` MODIFY `itemId` VARCHAR(8) NOT NULL COMMENT '物品ID';
ALTER TABLE `tbl_item_log` ADD INDEX (`log_at`, `itemId`, `scene`);

-- ----------------------------
-- 2018-04-23
-- DFC: Add new field for tbl_order
-- ----------------------------
ALTER TABLE `tbl_order` ADD `item_list` text COMMENT '购买成功添加的物品';