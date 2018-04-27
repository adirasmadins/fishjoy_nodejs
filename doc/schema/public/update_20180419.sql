-- ----------------------------
-- 2018-04-19
-- YXL: modify tbl_item_log
-- ----------------------------
ALTER TABLE `tbl_item_log` MODIFY `itemId` VARCHAR(8) NOT NULL COMMENT '物品ID'
ALTER TABLE `tbl_item_log` ADD INDEX (`log_at`, `itemId`, `scene`)