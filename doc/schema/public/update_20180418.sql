-- ----------------------------
-- 2018-04-18
-- DFC: Add new field for tbl_order
-- ----------------------------
alter table `tbl_order` ADD `item_type` tinyint(4) DEFAULT '0' COMMENT '购买的商品类型(0-钻石，1-金币)';
alter table `tbl_order` ADD `item_list` text COMMENT '购买成功添加的物品';





