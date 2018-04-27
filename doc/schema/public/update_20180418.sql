-- ----------------------------
-- 2018-04-18
-- DFC: Add new field for tbl_order
-- ----------------------------
ALTER TABLE `tbl_order` ADD `item_type` tinyint DEFAULT 0 COMMENT '购买的商品类型(0-钻石，1-金币)';