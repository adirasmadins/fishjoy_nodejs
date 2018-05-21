-- ----------------------------
-- 2018-04-19
-- YXL: modify tbl_item_log
-- ----------------------------
ALTER TABLE `tbl_item_log` MODIFY `itemId` VARCHAR(8) NOT NULL COMMENT '物品ID'
ALTER TABLE `tbl_item_log` ADD INDEX (`log_at`, `itemId`, `scene`)

# 修改数据库:
ALTER DATABASE fishjoy CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
# 修改表:
ALTER TABLE tbl_account CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
# 修改表字段:
ALTER TABLE tbl_account CHANGE nickname nickname VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;