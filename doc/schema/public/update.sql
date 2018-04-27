alter table `tbl_stat_hour` ADD `activeDevice` int(11) NOT NULL DEFAULT '0' COMMENT '上一个小时活跃设备数';
alter table `tbl_stat_hour` ADD `newDevice` int(11) NOT NULL DEFAULT '0' COMMENT '上一个小时新增设备数';
alter table `tbl_order` ADD `goods_name` varchar(64) DEFAULT NULL COMMENT '商品名称';