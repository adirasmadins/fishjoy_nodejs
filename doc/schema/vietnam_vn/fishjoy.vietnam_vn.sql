-- MySQL dump 10.14  Distrib 5.5.56-MariaDB, for Linux (x86_64)
--
-- Host: 10.66.204.213    Database: fishjoy
-- ------------------------------------------------------
-- Server version	5.6.28-cdb2016-log

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `log_mail_reward`
--

DROP TABLE IF EXISTS `log_mail_reward`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `log_mail_reward` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '自增表ID',
  `uid` bigint(20) NOT NULL COMMENT '玩家ID(User ID)',
  `mid` bigint(20) NOT NULL COMMENT '邮件ID(Mail ID)',
  `log_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '邮件领取发生的时间',
  `reward` text NOT NULL COMMENT '邮件的奖励',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=131203 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_account`
--

DROP TABLE IF EXISTS `tbl_account`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_account` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '自增字段',
  `tempname` varchar(32) NOT NULL COMMENT '临时账户名，平台前缀_id',
  `nickname` varchar(32) DEFAULT NULL COMMENT '昵称，最长32个英文字符，没有设置时是渠道缩写+id',
  `password` varchar(255) DEFAULT NULL COMMENT '当前密码，长度是6~10位字母加数字',
  `pwd_history` varchar(128) DEFAULT NULL COMMENT '历史使用密码，用于账户找回',
  `vip` int(11) NOT NULL DEFAULT '0' COMMENT '0表示非VIP，>0的数字表示VIP等级',
  `rmb` int(11) NOT NULL DEFAULT '0' COMMENT '玩家累计充值金额，单位为分',
  `exp` int(11) NOT NULL DEFAULT '0' COMMENT '玩家经验值',
  `level` int(11) NOT NULL DEFAULT '1' COMMENT '玩家等级，和经验值有关',
  `login_count` int(11) NOT NULL DEFAULT '0' COMMENT '总登录次数',
  `logout_count` int(11) NOT NULL DEFAULT '0' COMMENT '总退出次数',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '账户创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录更新时间',
  `pfft_at` timestamp NULL DEFAULT NULL COMMENT '首次付费时间(Pay For the First Time)',
  `salt` varchar(64) DEFAULT NULL,
  `token` varchar(88) DEFAULT NULL,
  `gold` int(11) NOT NULL DEFAULT '1000' COMMENT '玩家当前金币总量',
  `pearl` int(11) NOT NULL DEFAULT '10' COMMENT '玩家当前珍珠总量',
  `weapon` int(11) NOT NULL DEFAULT '1' COMMENT '玩家当前的武器等级',
  `weapon_energy` text COMMENT '记录每一级武器的充能状态',
  `weapon_skin` varchar(128) NOT NULL DEFAULT '{"own":[1],"equip":1}' COMMENT '武器皮肤, 包括玩家当前拥有的皮肤数组，以及当前装备的皮肤({own:[1,2,3], equip:1})',
  `vip_weapon_id` varchar(64) DEFAULT NULL COMMENT 'VIP专属炮台ID',
  `skill` varchar(256) DEFAULT NULL COMMENT '玩家获得的技能数组(数值)',
  `broke_times` int(11) NOT NULL DEFAULT '0' COMMENT '当日已领取的破产次数，每破产一次加1，每日凌晨此值全部恢复为0',
  `first_login` int(11) NOT NULL DEFAULT '1' COMMENT '是否当日第一次登录，登录后设置为0，每日凌晨此值全部恢复为1',
  `day_reward` int(11) NOT NULL DEFAULT '1' COMMENT '是否领取签到奖励，领取后这个值会被设置为0，每日凌晨此值全部恢复为1',
  `day_reward_weekly` int(11) NOT NULL DEFAULT '0' COMMENT '玩家历史领取的奖励次数',
  `vip_daily_fill` int(11) NOT NULL DEFAULT '1' COMMENT '每日VIP自动补满，当账户为VIP账号时(vip > 0)，每日第一次登录补满金币',
  `channel` varchar(8) NOT NULL DEFAULT 'fj' COMMENT '同时也是tempname的前缀',
  `channel_account_id` varchar(64) DEFAULT NULL COMMENT '非渠道接入此字段可以为空',
  `channel_account_name` varchar(32) DEFAULT NULL COMMENT '渠道账户的名字',
  `channel_account_info` varchar(1024) DEFAULT NULL COMMENT '渠道用户的详细信息',
  `level_mission` varchar(1024) DEFAULT '{}' COMMENT '关卡数据(每一个关卡的剩余挑战次数和剩余购买次数)',
  `mission_daily_reset` text COMMENT '每日重置任务',
  `mission_only_once` text COMMENT '一次任务',
  `first_buy` text COMMENT '首充',
  `activity_gift` text COMMENT '活动礼包',
  `heartbeat` int(11) NOT NULL DEFAULT '1' COMMENT '心跳，由客户端更新，每日凌晨重置为0',
  `achieve_point` int(11) NOT NULL DEFAULT '0' COMMENT '成就点，由客户端更新，用于成就排名统计',
  `gold_shopping` int(11) NOT NULL DEFAULT '0' COMMENT '金币购买次数，每日凌晨重置，不同等级VIP购买上限不同',
  `bonus` text COMMENT '为奖金鱼开发的一个字段({fish_count:1, gold_count:1, got:true|false})',
  `drop_reset` text COMMENT '需要每日重置的掉落物品记录',
  `drop_once` text COMMENT '不需要每日重置的掉落物品记录',
  `comeback` text COMMENT '翻盘购买记录，需要每日重置',
  `vip_gift` text COMMENT 'vip礼包的购买情况',
  `pirate` text COMMENT '不同场景的海盗任务存档',
  `card` text COMMENT '月卡购买日期的记录，没有月卡为{}或空',
  `get_card` varchar(50) NOT NULL DEFAULT '{"normal":false,"senior":false}' COMMENT '每日凌晨重置为{"normal":false,"senior":false}',
  `first_buy_gift` tinyint(1) NOT NULL DEFAULT '0' COMMENT '首充大礼包是否已经领取',
  `package` text COMMENT '背包数据',
  `guide` tinyint(1) NOT NULL DEFAULT '0' COMMENT '玩家是否完成新手引导的标志，完成后设置为true',
  `guide_weak` text COMMENT '玩家弱引导完成状态',
  `active` text COMMENT '活动记录',
  `active_stat_once` text COMMENT '活动领取记录(一次领取)',
  `active_stat_reset` text COMMENT '活动领取记录(需要每日重置)',
  `mail_box` text COMMENT '玩家的邮箱',
  `free_draw` text COMMENT '剩余免费抽奖次数',
  `roipct_time` bigint(20) DEFAULT '0' COMMENT '时间戳(new Date().getTime())',
  `aquarium` text COMMENT '水族馆，放置解锁的鱼，包含鱼的等级信息',
  `goddess` text COMMENT '女神数据',
  `figure` bigint(20) DEFAULT '1' COMMENT '玩家头像id, 具体链接到tbl_img中查找',
  `redress_no` int(11) NOT NULL DEFAULT '0' COMMENT '防重名编号',
  `day_reward_adv` tinyint(1) NOT NULL DEFAULT '0' COMMENT '每日广告领取(0表示未领取, 1表示已经领取)',
  `free_goddess` varchar(11) NOT NULL DEFAULT '[1,1,1,1,1]' COMMENT '每日女神免费次数',
  `platform` int(4) NOT NULL DEFAULT '1' COMMENT '平台(1表示Android, 2表示iOS)',
  `total_draw` text COMMENT '今日玩家抽奖总次数, 需要每日重置({"gold":0,"diamond":0})',
  `jointype` int(11) NOT NULL DEFAULT '0' COMMENT '加入类型码, 0表示还没设置, 100表示邀请, 101表示点击分享, 103表示推广进来的',
  `test` tinyint(2) NOT NULL DEFAULT '0' COMMENT '是否测试人员(0:不是,1:开发,2:测试)',
  `active_daily_reset` text COMMENT '需要每日重置的活动任务，返回给玩家的active需要结合这个字段',
  `who_invite_me` bigint(20) NOT NULL DEFAULT '0' COMMENT '邀请我的好友ID, 为0表示没有好友邀请我',
  `who_share_me` bigint(20) NOT NULL DEFAULT '0' COMMENT '我点击了谁的分享链接, 为0表示我不是分享而来',
  `rank_in_friends` int(11) NOT NULL DEFAULT '0' COMMENT '当前在朋友中的排名, 如果查询好友排行榜时值比这个小则通知客户端',
  `over_me_friends` text COMMENT '排名超过了自己的好友openid，查询好友排名时会把当时超过的好友列表返回',
  `heartbeat_min_cost` int(11) NOT NULL DEFAULT '0' COMMENT '心跳期间最低消耗, 每日重置',
  `goddess_free` int(11) NOT NULL DEFAULT '1' COMMENT '每日女神免费次数(优化后)',
  `goddess_ctimes` int(11) NOT NULL DEFAULT '0' COMMENT '每日女神挑战次数记录',
  `goddess_crossover` int(11) NOT NULL DEFAULT '0' COMMENT '女神挑战的跨天次数',
  `goddess_ongoing` tinyint(1) NOT NULL DEFAULT '0' COMMENT '保卫女神是否进行中, 1表示进行中, 0表示没有保卫女神',
  `last_online_time` timestamp NULL DEFAULT NULL COMMENT '用户上次在线时间，缓存清理以此为基础',
  `new_reward_adv` tinyint(4) NOT NULL DEFAULT '0' COMMENT '新手礼包领取(0表示未领取, 1表示已经领取)',
  `charm_rank` int(11) NOT NULL DEFAULT '0' COMMENT '魅力等级',
  `charm_point` int(11) NOT NULL DEFAULT '0' COMMENT '魅力值',
  `sex` tinyint(1) NOT NULL DEFAULT '0' COMMENT '0男1女',
  `city` varchar(20) NOT NULL DEFAULT '四川' COMMENT '玩家城市信息',
  `vip_daily_reward` smallint(6) NOT NULL DEFAULT '0' COMMENT 'vip每日领取,0-未领,1-已领',
  PRIMARY KEY (`id`),
  KEY `channel_account_id` (`channel_account_id`),
  KEY `channel_account_name` (`channel_account_name`)
) ENGINE=InnoDB AUTO_INCREMENT=1087430 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_account_server`
--

DROP TABLE IF EXISTS `tbl_account_server`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_account_server` (
  `uid` bigint(20) NOT NULL COMMENT '用户ID(User ID)',
  `sid` smallint(6) NOT NULL COMMENT '服务器ID(Server ID)',
  `login_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '登录时间记录',
  UNIQUE KEY `uid` (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_account_sign`
--

DROP TABLE IF EXISTS `tbl_account_sign`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_account_sign` (
  `id` bigint(20) NOT NULL COMMENT '玩家ID',
  `month_sign` varchar(64) DEFAULT NULL COMMENT '玩家当月签到状态记录',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_activity`
--

DROP TABLE IF EXISTS `tbl_activity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_activity` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '活动的唯一标识',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '礼包创建时间',
  `gift_id` int(11) NOT NULL COMMENT '礼包ID，不是唯一值，和version一起组成唯一值',
  `description` varchar(128) DEFAULT NULL COMMENT '描述',
  `name` varchar(32) DEFAULT NULL COMMENT '礼包名称',
  `icon` varchar(32) DEFAULT NULL COMMENT '礼包图标',
  `price` int(11) DEFAULT NULL COMMENT '价格单位: 元',
  `item` varchar(128) NOT NULL DEFAULT '{}' COMMENT '礼包内容',
  `condition` varchar(128) DEFAULT NULL COMMENT '礼包条件',
  `value` varchar(128) DEFAULT NULL COMMENT '条件参数',
  `starttime` varchar(32) DEFAULT NULL COMMENT '开始时间',
  `endtime` varchar(32) DEFAULT NULL COMMENT '截止时间',
  `buycount` int(11) NOT NULL DEFAULT '1' COMMENT '可购买次数',
  `version` int(11) NOT NULL COMMENT '礼包版本，修改或重新启用时都需要用版本号标识',
  `revoke` tinyint(1) DEFAULT NULL COMMENT '是否强制下线',
  `discount` float DEFAULT NULL COMMENT '折扣',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_admin_auth`
--

DROP TABLE IF EXISTS `tbl_admin_auth`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_admin_auth` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `page` varchar(128) DEFAULT NULL COMMENT '可以访问的页面',
  `description` varchar(256) DEFAULT NULL COMMENT '描述',
  `parent` int(11) DEFAULT NULL COMMENT '父级选项卡',
  `level` int(4) DEFAULT NULL COMMENT '层级',
  `valid` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否在角色管理中可见',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_admin_role`
--

DROP TABLE IF EXISTS `tbl_admin_role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_admin_role` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `rname` varchar(16) NOT NULL COMMENT '角色名',
  `description` varchar(256) DEFAULT NULL COMMENT '描述',
  `auth_ids` varchar(256) DEFAULT NULL COMMENT '权限ID表',
  `valid` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否能在用户管理中看到',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_admin_user`
--

DROP TABLE IF EXISTS `tbl_admin_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_admin_user` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `uname` varchar(16) NOT NULL COMMENT '用户名(User Name)',
  `salt` varchar(64) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL COMMENT '密码',
  `token` varchar(255) DEFAULT NULL COMMENT '返回给用户使用的token',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00' COMMENT '更新时间',
  `role` tinyint(4) DEFAULT NULL COMMENT '角色',
  `valid` tinyint(1) DEFAULT NULL COMMENT '是否生效',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_ai`
--

DROP TABLE IF EXISTS `tbl_ai`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_ai` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '表ID',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '创建记录的时间',
  `last_log_id` bigint(20) NOT NULL DEFAULT '0' COMMENT '记录上一次计算AI时的位置',
  `wpTimesP` text,
  `firstFireSecondsP` float NOT NULL DEFAULT '0',
  `noFireQuitChanceP` float NOT NULL DEFAULT '0',
  `fishTimesP` text,
  `sameFishAverageDtP` float NOT NULL DEFAULT '0',
  `targetShiftTimesP` text,
  `normalStaySecondsP` float NOT NULL DEFAULT '0',
  `brokenStaySecondsP` float NOT NULL DEFAULT '0',
  `iceSkillTimesP` float NOT NULL DEFAULT '0',
  `lockSkillChanceP` text,
  `callSkillTimesP` float NOT NULL DEFAULT '0',
  `holdChanceP` float NOT NULL DEFAULT '0',
  `holdAverageSecondsP` float NOT NULL DEFAULT '0',
  `waitAverageSecondsP` float NOT NULL DEFAULT '0',
  `holdingQuitChanceP` float NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_ai_log`
--

DROP TABLE IF EXISTS `tbl_ai_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_ai_log` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '表ID',
  `account_id` bigint(20) NOT NULL COMMENT '用户ID',
  `log_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录时间，用于统计判断',
  `wpTimes` text COMMENT '炮使用平均概率： 所有玩家在不同场景使用各种倍率炮的平均概率',
  `firstFireSeconds` float NOT NULL DEFAULT '0' COMMENT '平均延时： 所有玩家进入场景后， 开第一炮或者不开炮离开的平均时长',
  `noFireQuitChance` int(11) NOT NULL DEFAULT '0' COMMENT '延时后退出平均概率： 所有玩家进入场景， 在延时后执行退出操作的平均概率（ 限时模式不统计该项）',
  `fishTimes` text COMMENT '目标选择平均概率： 目标选择系数 / 当前场景所有鱼目标选择系数之和',
  `sameFishAverageDt` float NOT NULL DEFAULT '0' COMMENT '平均攻击间隔： 所有玩家连续攻击一个目标时的平均攻击间隔（ 不包含转移目标后， 必须是连续攻击同一个目标）',
  `targetShiftTimes` text COMMENT '平均转移目标次数：所有玩家平均攻击该目标多少次后转移（包括捕获到或者破产）',
  `normalStaySeconds` float NOT NULL DEFAULT '0' COMMENT '平均正常离场时间：所有玩家进入该场景平均多长时间离场（限时模式不统计该项）',
  `brokenStaySeconds` float NOT NULL DEFAULT '0' COMMENT '平均破产离场时间：所有玩家在该场景破产后平均多长时间离场（限时模式不统计该项）',
  `iceSkillTimes` int(11) NOT NULL DEFAULT '0' COMMENT '冰冻使用平均概率：鱼被所有玩家攻击时使用冰冻的平均概率',
  `lockSkillChance` text COMMENT '锁定使用平均概率：鱼被所有玩家攻击时使用锁定的平均概率',
  `callSkillTimes` int(11) NOT NULL DEFAULT '0' COMMENT '玩家对各种鱼的使用召唤技能次数',
  `holdChance` int(11) NOT NULL DEFAULT '0' COMMENT '呆立平均概率：所有玩家转移目标时出现呆立的平均概率（30秒以上无任何操作）',
  `holdAverageSeconds` float NOT NULL DEFAULT '0' COMMENT '平均呆立时长： 所有玩家平均每次呆立的平均时长',
  `waitAverageSeconds` float NOT NULL DEFAULT '0' COMMENT '平均停顿时长：所有玩家转移目标(包括未捕获转移、捕获转移)时停顿的平均时长',
  `holdingQuitChance` int(11) NOT NULL DEFAULT '0' COMMENT '呆立后操作平均概率：所有玩家呆立后直接退出的平均概率',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_aquarium`
--

DROP TABLE IF EXISTS `tbl_aquarium`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_aquarium` (
  `id` bigint(20) NOT NULL COMMENT '用户ID',
  `total_level` int(11) NOT NULL DEFAULT '0' COMMENT '用户所有解锁鱼等级之和',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_bind_log`
--

DROP TABLE IF EXISTS `tbl_bind_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_bind_log` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `account_id` bigint(20) NOT NULL COMMENT '账户ID',
  `nickname` varchar(8) NOT NULL COMMENT '账户绑定的名称',
  `log_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录log的时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_cd_key`
--

DROP TABLE IF EXISTS `tbl_cd_key`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_cd_key` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '创建CD-KEY的时间',
  `cd_key` varchar(16) NOT NULL COMMENT '由程序生成的CD-KEY',
  `action_id` bigint(20) NOT NULL COMMENT '活动ID',
  `account_id` bigint(20) DEFAULT NULL COMMENT '使用的玩家ID',
  `use_time` varchar(32) DEFAULT NULL COMMENT '使用时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_change_log`
--

DROP TABLE IF EXISTS `tbl_change_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_change_log` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '实物兑换订单ID',
  `orderid` varchar(20) DEFAULT NULL COMMENT 'SN订单序列号',
  `sn` int(11) DEFAULT '1' COMMENT 'SN',
  `uid` bigint(20) NOT NULL COMMENT '用户ID(User ID)',
  `name` varchar(20) DEFAULT NULL COMMENT '用户真实姓名',
  `phone` varchar(20) DEFAULT NULL COMMENT '用户手机号',
  `address` varchar(128) DEFAULT NULL COMMENT '用户收件地址',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '兑换时间(创建时间)',
  `ship_at` timestamp NULL DEFAULT NULL COMMENT '发货时间',
  `cid` text NOT NULL COMMENT '兑换物品ID(Change ID)',
  `catalog` int(11) NOT NULL DEFAULT '1' COMMENT '物品分类(1-话费卡,2-实物道具,3-游戏道具)',
  `count` int(11) DEFAULT NULL COMMENT '获取物品的数量',
  `cost` int(11) DEFAULT NULL COMMENT '物品消耗的兑换券数量',
  `itemname` varchar(64) DEFAULT NULL COMMENT '兑换物品的名称',
  `status` int(11) NOT NULL DEFAULT '0' COMMENT '兑换状态(0:处理中,1:成功,2:失败,3:玩家取消)',
  `thingnum` varchar(32) DEFAULT NULL COMMENT '物流号码',
  `way` varchar(16) DEFAULT NULL COMMENT '物流渠道',
  `icon` varchar(32) DEFAULT NULL COMMENT '物品ICON',
  `card_num` varchar(32) DEFAULT NULL COMMENT '话费卡卡号',
  `card_pwd` varchar(32) DEFAULT NULL COMMENT '话费卡卡密',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=832 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_channel_create`
--

DROP TABLE IF EXISTS `tbl_channel_create`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_channel_create` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '唯一ID',
  `channel_uid` varchar(128) NOT NULL COMMENT '渠道的ID',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '玩家第一次进入游戏时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '玩家最近一次进入游戏的时间',
  `count` int(11) NOT NULL DEFAULT '0' COMMENT '点击次数统计',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19266 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_channel_login`
--

DROP TABLE IF EXISTS `tbl_channel_login`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_channel_login` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '唯一ID',
  `channel_create_id` bigint(20) NOT NULL COMMENT 'tbl_channel_create中的唯一ID',
  `log_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '玩家每次进入游戏时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=98471 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_daily_statistics`
--

DROP TABLE IF EXISTS `tbl_daily_statistics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_daily_statistics` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `account_id` bigint(20) NOT NULL COMMENT '账户ID',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '产生数据的时间',
  `date` date DEFAULT NULL COMMENT '产生数据的日期，由产生数据的时间进行计算',
  `login_count` int(11) DEFAULT '0' COMMENT '每日登录的总次数',
  `logout_count` int(11) DEFAULT '0' COMMENT '每日退出登录的次数',
  `gold_gain` varchar(256) DEFAULT NULL COMMENT '每日获得的金币总量(按不同场景分别统计)',
  `gold_cost` varchar(256) DEFAULT NULL COMMENT '每日消耗的金币总量(按不同场景分别统计，有抽奖)',
  `gold_shop_count` int(11) DEFAULT '0' COMMENT '每日在商城购买金币的次数',
  `gold_shop_amount` int(11) DEFAULT '0' COMMENT '每日在商城购买金币的总量',
  `pearl_gain` varchar(256) DEFAULT NULL COMMENT '每日获得的珍珠总量(按不同场景分别统计)',
  `pearl_cost` varchar(256) DEFAULT NULL COMMENT '每日消耗的珍珠总量(按不同场景分别统计)',
  `pearl_shop_count` int(11) DEFAULT '0' COMMENT '每日在商城购买珍珠的次数',
  `pearl_shop_amount` int(11) DEFAULT '0' COMMENT '每日在商城购买珍珠的总量',
  `skill_gain` varchar(256) DEFAULT NULL COMMENT '每日获得技能总量(按不同技能ID分别记录)',
  `skill_cost` varchar(256) DEFAULT NULL COMMENT '每日消耗技能总量(按不同技能ID分别记录)',
  `account_levelup` int(11) DEFAULT '0' COMMENT '每日账户升级的等级数',
  `weapon_levelup_exp` int(11) DEFAULT '0' COMMENT '每日武器升级的等级数(因为经验值升级)',
  `weapon_levelup_pearl` int(11) DEFAULT '0' COMMENT '每日武器升级的等级数(因为珍珠升级)',
  `game_time` varchar(256) DEFAULT NULL COMMENT '每日游戏时间(按不同的模式进行分别统计)',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6878146 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_drop_log`
--

DROP TABLE IF EXISTS `tbl_drop_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_drop_log` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `account_id` bigint(20) NOT NULL COMMENT '用户ID',
  `log_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录日志的时间',
  `drop_key` varchar(16) NOT NULL COMMENT '掉落表中的ID',
  `times` int(11) NOT NULL DEFAULT '0' COMMENT '当前掉落次数',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_drop_serverlimit`
--

DROP TABLE IF EXISTS `tbl_drop_serverlimit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_drop_serverlimit` (
  `key` varchar(16) NOT NULL COMMENT 'drop_key+time_idx组合而成的键值',
  `limit_type` smallint(6) NOT NULL COMMENT '限制类型,1-按天, 2-按小时',
  `limit_count` int(11) NOT NULL COMMENT '一个周期内, 全服限制数量',
  `current_value` int(11) NOT NULL COMMENT '当前值',
  `platform` smallint(6) NOT NULL DEFAULT '1' COMMENT '平台标识, 安卓1，苹果2',
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_exp_log`
--

DROP TABLE IF EXISTS `tbl_exp_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_exp_log` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `account_id` bigint(20) NOT NULL COMMENT '玩家ID',
  `added_exp` int(11) NOT NULL DEFAULT '0' COMMENT '玩家增加的经验值',
  `total_exp` int(11) NOT NULL DEFAULT '0' COMMENT '玩家当前的经验值',
  `duration` int(11) NOT NULL DEFAULT '0' COMMENT '距离上次更新过去的时间(单位: 毫秒)',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_goddess`
--

DROP TABLE IF EXISTS `tbl_goddess`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_goddess` (
  `id` bigint(20) NOT NULL COMMENT '用户id',
  `max_wave` int(11) NOT NULL DEFAULT '0' COMMENT '最大波数',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `week_reward` smallint(2) NOT NULL DEFAULT '0' COMMENT '0:不可领取,1:可领取,2:已领取',
  `week_rank` int(11) NOT NULL DEFAULT '0' COMMENT '本周保卫女神名次, 默认值0, 1~1000可领取奖励',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_gold`
--

DROP TABLE IF EXISTS `tbl_gold`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_gold` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `account_id` bigint(20) NOT NULL COMMENT '账户ID',
  `current_total` int(11) NOT NULL DEFAULT '1000' COMMENT '当前玩家持有总金币量',
  `total_gain` int(11) NOT NULL DEFAULT '0' COMMENT '获得金币总量',
  `total_cost` int(11) NOT NULL DEFAULT '0' COMMENT '消费金币总量',
  `shop_count` int(11) NOT NULL DEFAULT '0' COMMENT '商城购买金币总次数',
  `shop_amount` int(11) NOT NULL DEFAULT '0' COMMENT '商城购买金币总量',
  PRIMARY KEY (`id`),
  UNIQUE KEY `account_id_2` (`account_id`),
  KEY `account_id` (`account_id`)
) ENGINE=InnoDB AUTO_INCREMENT=120212654 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_gold_log`
--

DROP TABLE IF EXISTS `tbl_gold_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_gold_log` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '自增ID',
  `account_id` bigint(20) NOT NULL COMMENT '账户ID',
  `log_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录日志的时间',
  `gain` int(11) NOT NULL DEFAULT '0' COMMENT '获得金币数',
  `cost` int(11) NOT NULL DEFAULT '0' COMMENT '消费金币数',
  `total` int(11) DEFAULT '0' COMMENT '玩家持有的金币总数，此字段需要和玩家当前持有金币信息进行验证',
  `duration` int(11) DEFAULT '0' COMMENT '玩家距离上次更新时过了多长时间，单位为秒',
  `scene` int(11) DEFAULT NULL COMMENT '在哪种场景下的改变',
  `nickname` tinyint(1) NOT NULL DEFAULT '0' COMMENT '玩家是否为昵称账户的标识',
  `level` int(11) NOT NULL DEFAULT '1' COMMENT '玩家当前等级',
  `fire` int(11) NOT NULL DEFAULT '0' COMMENT '玩家开火数',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=140626253 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_huafei_log`
--

DROP TABLE IF EXISTS `tbl_huafei_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_huafei_log` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `uid` bigint(20) NOT NULL COMMENT '玩家UID',
  `gain` int(11) NOT NULL DEFAULT '0' COMMENT '获取数量',
  `cost` int(11) NOT NULL DEFAULT '0' COMMENT '消耗数量',
  `total` int(11) NOT NULL DEFAULT '0' COMMENT '存量',
  `scene` smallint(6) NOT NULL COMMENT '场景',
  `comment` varchar(128) DEFAULT NULL COMMENT '注释',
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '时间戳',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5115 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_img`
--

DROP TABLE IF EXISTS `tbl_img`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_img` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `web_url` text COMMENT '网络图片链接',
  `local_url` text COMMENT '本地图片链接',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2188961 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_link_log`
--

DROP TABLE IF EXISTS `tbl_link_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_link_log` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '自增ID',
  `uid` bigint(20) NOT NULL COMMENT '用户ID, 用户调用任意API都会记录到这个表',
  `linked_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录的时间戳，由批量写入主动更新',
  `api` int(11) NOT NULL COMMENT '调用API, 需要一个对应表来转换',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_link_sum`
--

DROP TABLE IF EXISTS `tbl_link_sum`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_link_sum` (
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录时间',
  `online_count` int(11) NOT NULL DEFAULT '0' COMMENT '记录时间前一分钟同时在线人数',
  `sid` int(11) NOT NULL DEFAULT '0' COMMENT '记录服务器ID',
  `link_count` int(11) NOT NULL DEFAULT '0' COMMENT '记录前一分钟的API调用数',
  `top10_link` varchar(128) DEFAULT NULL COMMENT '记录前一分钟调用最频繁的API编号前10'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_login_log`
--

DROP TABLE IF EXISTS `tbl_login_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_login_log` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `account_id` bigint(20) NOT NULL COMMENT '账户ID',
  `log_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录日志的时间',
  `nickname` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否为昵称账户',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4891545 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_logout_log`
--

DROP TABLE IF EXISTS `tbl_logout_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_logout_log` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `account_id` bigint(20) NOT NULL COMMENT '账户ID',
  `log_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录日志的时间',
  `nickname` tinyint(1) NOT NULL DEFAULT '0' COMMENT '玩家是否为昵称账户',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_mail`
--

DROP TABLE IF EXISTS `tbl_mail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_mail` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '表ID',
  `type` tinyint(4) NOT NULL COMMENT '邮件类型(服务器邮件, 排行榜邮件)',
  `title` varchar(64) DEFAULT NULL COMMENT '邮件标题',
  `content` text COMMENT '邮件内容',
  `reward` text COMMENT '奖励',
  `sendtime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发送邮件时间',
  `receiver` int(11) NOT NULL DEFAULT '0' COMMENT '收件人总数',
  `received` int(11) NOT NULL DEFAULT '0' COMMENT '已收邮件人总数',
  `receiverUid` text COMMENT '所有收件人的UID',
  `receivedUid` text COMMENT '已收邮件玩家的UID',
  `addByWho` bigint(20) DEFAULT NULL COMMENT '发件人的ID(管理员才可发信)',
  `status` smallint(6) NOT NULL DEFAULT '1' COMMENT '邮件状态(0-取消,1-有效)',
  `validtime` timestamp NULL DEFAULT NULL COMMENT '生效时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8525 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_operation`
--

DROP TABLE IF EXISTS `tbl_operation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_operation` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '运营项目ID',
  `cfg_id` int(11) DEFAULT NULL COMMENT '配置表ID',
  `desc` varchar(128) DEFAULT NULL COMMENT '项目描述',
  `value` int(11) DEFAULT NULL COMMENT '设置值',
  `type` int(11) NOT NULL DEFAULT '1' COMMENT '运营类型(1:实物兑换,2:总开关)',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=102 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_order`
--

DROP TABLE IF EXISTS `tbl_order`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_order` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `sn` bigint(20) DEFAULT NULL COMMENT '当日ID的序列号',
  `game_order_id` varchar(64) NOT NULL COMMENT '订单号(日期+序号(10位数, 相当于1天10亿订单))',
  `channel_order_id` varchar(64) DEFAULT NULL COMMENT '渠道订单号',
  `game_account_id` bigint(20) NOT NULL COMMENT '游戏账户ID',
  `channel_account_id` varchar(64) DEFAULT NULL COMMENT '渠道账户ID',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '订单创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '订单修改时间(渠道回调)',
  `goods_id` int(11) DEFAULT NULL COMMENT '物品ID',
  `goods_number` int(11) DEFAULT NULL COMMENT '物品数量',
  `money` float DEFAULT NULL COMMENT '实际支付金额',
  `status` int(11) NOT NULL DEFAULT '2' COMMENT '订单状态: 0-成功, 1-失败, 2-处理中',
  `channel_cb` varchar(1024) DEFAULT NULL COMMENT '支付渠道回调信息',
  `channel` varchar(4) DEFAULT NULL COMMENT '渠道ID',
  `card_serial` varchar(64) DEFAULT NULL COMMENT '玩家充值的卡号serial',
  `card_code` varchar(64) DEFAULT NULL COMMENT '玩家充值的卡密code',
  `goods_name` varchar(64) DEFAULT NULL COMMENT '商品名称',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=146570 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_pearl`
--

DROP TABLE IF EXISTS `tbl_pearl`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_pearl` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `account_id` bigint(20) NOT NULL COMMENT '账户ID',
  `current_total` int(11) NOT NULL DEFAULT '10' COMMENT '当前持有珍珠的总量',
  `total_gain` int(11) NOT NULL DEFAULT '0' COMMENT '获得珍珠的总量',
  `total_cost` int(11) NOT NULL DEFAULT '0' COMMENT '消耗珍珠的总量',
  `shop_count` int(11) NOT NULL DEFAULT '0' COMMENT '商城购买珍珠的总次量',
  `shop_amount` int(11) NOT NULL DEFAULT '0' COMMENT '商城购买珍珠的总量',
  PRIMARY KEY (`id`),
  UNIQUE KEY `account_id_2` (`account_id`),
  KEY `account_id` (`account_id`)
) ENGINE=InnoDB AUTO_INCREMENT=120831400 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_pearl_log`
--

DROP TABLE IF EXISTS `tbl_pearl_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_pearl_log` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `account_id` bigint(20) NOT NULL COMMENT '账户ID',
  `log_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录日志的时间',
  `gain` int(11) NOT NULL DEFAULT '0' COMMENT '本次获得珍珠的数量',
  `cost` int(11) NOT NULL DEFAULT '0' COMMENT '本次消耗的珍珠数量',
  `total` int(11) NOT NULL DEFAULT '0' COMMENT '玩家目前持有的珍珠总量',
  `scene` int(11) DEFAULT NULL COMMENT '玩家在何种场景获得或消耗珍珠',
  `nickname` tinyint(1) NOT NULL DEFAULT '0' COMMENT '玩家是否为昵称账户的标识',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25077041 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_propose`
--

DROP TABLE IF EXISTS `tbl_propose`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_propose` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `uid` bigint(20) NOT NULL COMMENT '提建议玩家的ID',
  `text` varchar(512) DEFAULT NULL COMMENT '留言内容',
  `time` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '留言时间',
  `like_uids` text COMMENT '点赞玩家的uid',
  `like_count` int(11) DEFAULT '0' COMMENT '点赞数',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11683 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_rankgame`
--

DROP TABLE IF EXISTS `tbl_rankgame`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_rankgame` (
  `id` bigint(20) NOT NULL COMMENT '对应玩家的ID',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '玩家最近一次比赛的时间',
  `win` int(11) NOT NULL DEFAULT '0' COMMENT '胜利场次',
  `fail` int(11) NOT NULL DEFAULT '0' COMMENT '失败场次',
  `points` int(11) NOT NULL DEFAULT '800' COMMENT '积分(积分决定段位)',
  `rank` int(11) NOT NULL DEFAULT '1' COMMENT '玩家段位(对应rankgame_cfg表中的id,最低段位是1)',
  `unfinish` bigint(20) NOT NULL DEFAULT '0' COMMENT '记录玩家没有结算的排位赛ID',
  `box` varchar(20) NOT NULL DEFAULT '0,0,0' COMMENT '玩家当前拥有的宝箱列表, 0表示宝箱位空着, 可以插入一个宝箱',
  `box_timestamp` varchar(50) NOT NULL DEFAULT '0,0,0' COMMENT '宝箱获取的时间戳, 0表示没有宝箱, 领取后重置',
  `first_box` varchar(255) NOT NULL DEFAULT '{"stat":1,"timestamp":0,"id":0}' COMMENT '首胜宝箱数据, timestamp为开启宝箱时间, stat为宝箱状态, 0为为获取, 1为获取, 2为领取',
  `season_count` int(11) NOT NULL DEFAULT '0' COMMENT '当前赛季进行了多少场比赛',
  `season_win` int(11) NOT NULL DEFAULT '0' COMMENT '本赛季胜利次数',
  `season_box` int(11) NOT NULL DEFAULT '0' COMMENT '本赛季开启宝箱次数',
  `season_first_win` int(11) NOT NULL DEFAULT '0' COMMENT '本赛季的首胜次数',
  `is_season_reward` tinyint(1) NOT NULL DEFAULT '1' COMMENT '本赛季奖励是否已经领取,,1表示不可领取, 0表示可以领取',
  `winning_streak` int(11) NOT NULL DEFAULT '0' COMMENT '连胜记录,只要是胜利就加1, 失败就重置为0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_rankgame_log`
--

DROP TABLE IF EXISTS `tbl_rankgame_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_rankgame_log` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '比赛ID',
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '比赛时间',
  `player1` bigint(20) NOT NULL COMMENT '比赛甲方id',
  `player2` bigint(20) NOT NULL COMMENT '比赛乙方id',
  `result` text NOT NULL COMMENT '比赛结果{winner:?, player1:{score:?, bullet:?, nuclear:?}, player2:{}}',
  `bullet_score1` int(11) NOT NULL DEFAULT '0' COMMENT '比赛甲方子弹得分',
  `rank1` int(11) NOT NULL DEFAULT '0' COMMENT '比赛甲方当前段位',
  `used_bullet1` int(11) NOT NULL DEFAULT '0' COMMENT '比赛甲方开炮数',
  `nuclear_score1` int(11) NOT NULL DEFAULT '0' COMMENT '比赛甲方核弹得分',
  `nuclear_exploded1` tinyint(1) NOT NULL DEFAULT '0' COMMENT '1表示使用, 0表示放弃',
  `rank2` int(11) NOT NULL DEFAULT '0' COMMENT '比赛乙方当前段位',
  `bullet_score2` int(11) NOT NULL DEFAULT '0' COMMENT '比赛乙方子弹得分',
  `used_bullet2` int(11) NOT NULL DEFAULT '0' COMMENT '比赛乙方开炮数',
  `nuclear_score2` int(11) NOT NULL DEFAULT '0' COMMENT '比赛乙方核弹得分',
  `nuclear_exploded2` tinyint(1) NOT NULL DEFAULT '0' COMMENT '1表示使用, 0表示放弃',
  `wait_time1` int(11) NOT NULL DEFAULT '0' COMMENT '甲方匹配等待时长(单位毫秒)',
  `wait_time2` int(11) NOT NULL DEFAULT '0' COMMENT '乙方匹配等待时长(单位毫秒)',
  PRIMARY KEY (`id`),
  KEY `player1` (`player1`),
  KEY `player2` (`player2`)
) ENGINE=InnoDB AUTO_INCREMENT=1438716 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_room`
--

DROP TABLE IF EXISTS `tbl_room`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_room` (
  `plazaid` int(11) NOT NULL DEFAULT '1' COMMENT '广场ID,一个服一个',
  `roomid` int(11) NOT NULL DEFAULT '0' COMMENT '房间ID,一个服1000个房间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_shop_log`
--

DROP TABLE IF EXISTS `tbl_shop_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_shop_log` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '表ID',
  `account_id` bigint(20) NOT NULL COMMENT '购买商品的玩家ID',
  `order_id` varchar(64) DEFAULT NULL COMMENT 'order表中的game_order_id',
  `log_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录日志的时间',
  `item_id` int(11) NOT NULL COMMENT '商品ID',
  `item_type` tinyint(4) NOT NULL COMMENT '商品是金币0，还是珍珠1',
  `item_amount` int(11) NOT NULL COMMENT '商品数量(60金币或300金币或...)',
  `price` int(11) NOT NULL DEFAULT '0' COMMENT '商品价格，单位是分',
  `nickname` tinyint(1) NOT NULL DEFAULT '0' COMMENT '玩家是否为昵称账户的标识',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20240 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_skill_log`
--

DROP TABLE IF EXISTS `tbl_skill_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_skill_log` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `account_id` bigint(20) NOT NULL COMMENT '账户ID',
  `log_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录日志的时间',
  `skill_id` int(11) NOT NULL COMMENT '技能ID',
  `gain` int(11) NOT NULL COMMENT '获得技能数量',
  `cost` int(11) NOT NULL COMMENT '消耗技能数量',
  `total` int(11) NOT NULL COMMENT '技能当前数量',
  `nickname` tinyint(1) NOT NULL DEFAULT '0' COMMENT '玩家是否为昵称账户的标识',
  `comment` varchar(100) NOT NULL DEFAULT '无' COMMENT '技能使用注释',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=40045749 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_social`
--

DROP TABLE IF EXISTS `tbl_social`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_social` (
  `id` bigint(20) NOT NULL COMMENT '用户ID',
  `invite_friends` text COMMENT '邀请到的用户ID列表',
  `share_friends` text COMMENT '分享邀请的用户列表',
  `invite_progress` int(11) NOT NULL DEFAULT '0' COMMENT '邀请进度, 是invite_friends字段朋友的个数, 此为冗余字段, 目的是方便查询和统计',
  `invite_reward` int(11) NOT NULL DEFAULT '0' COMMENT '邀请奖励的领取进度, 存储social_friends_cfg中的id',
  `share_status_0` text NOT NULL COMMENT '分享状态(不重复)',
  `share_status_1` text NOT NULL COMMENT '分享状态(每日重复)',
  `share_status_2` text NOT NULL COMMENT '分享状态(每周重复)',
  `enshrine_status` int(11) NOT NULL DEFAULT '0' COMMENT '收藏状态',
  `share_top_gold` tinyint(1) NOT NULL DEFAULT '0' COMMENT '世界首富且金币不低于500万',
  `share_top_rank` tinyint(1) NOT NULL DEFAULT '0' COMMENT '排位赛获得最强王者段位',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_stat_day`
--

DROP TABLE IF EXISTS `tbl_stat_day`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_stat_day` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `log_date` date NOT NULL COMMENT '记录的日期',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '创建记录的时间',
  `new_temp_account` int(11) NOT NULL DEFAULT '0' COMMENT '当日新增临时账户计数',
  `new_nickname_account` int(11) NOT NULL DEFAULT '0' COMMENT '当日新增昵称账户计数',
  `new_bind_account` int(11) NOT NULL DEFAULT '0' COMMENT '当日新增绑定账户计数',
  `nickname_login` int(11) NOT NULL DEFAULT '0' COMMENT '当日登录次数(昵称用户)',
  `temp_login` int(11) NOT NULL DEFAULT '0' COMMENT '当日登录次数(临时用户)',
  `nickname_count` int(11) NOT NULL DEFAULT '0' COMMENT '当日登录账户计数(昵称用户)',
  `temp_count` int(11) NOT NULL DEFAULT '0' COMMENT '当日登录账户计数(临时用户)',
  `drr` float NOT NULL DEFAULT '0' COMMENT 'DRR(Daily Retention Rate): 每日留存率',
  `wrr` float NOT NULL DEFAULT '0' COMMENT 'WRR(Weekly Retention Rate): 每周留存率',
  `mrr` float NOT NULL DEFAULT '0' COMMENT 'MRR(Monthly Retention Rate): 每月留存率',
  `shop_time_count` int(11) NOT NULL DEFAULT '0' COMMENT '商城购买次数',
  `shop_account_count` int(11) NOT NULL DEFAULT '0' COMMENT '商城购买人数',
  `shop_tpa` int(11) NOT NULL DEFAULT '0' COMMENT '当日在商店消费的总金额 ( Total Pay Amount ),单位分',
  `shop_pafft` int(11) NOT NULL DEFAULT '0' COMMENT '首次付费玩家 ( Pay Account For the First Time )',
  `shop_paffd` int(11) NOT NULL DEFAULT '0' COMMENT '首日付费玩家 ( Pay Account For the First Day )',
  `shop_pta` int(11) NOT NULL DEFAULT '0' COMMENT '充值人数比活跃账号数( Pay To Active )',
  `shop_arpu` int(11) NOT NULL DEFAULT '0' COMMENT '充值金额比活跃人数',
  `shop_arrpu` int(11) NOT NULL DEFAULT '0' COMMENT '充值金额比充值人数',
  PRIMARY KEY (`id`),
  UNIQUE KEY `LOG_DATE` (`log_date`)
) ENGINE=InnoDB AUTO_INCREMENT=4242 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_stat_hour`
--

DROP TABLE IF EXISTS `tbl_stat_hour`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_stat_hour` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '创建时间',
  `new_account` int(11) NOT NULL COMMENT '上一个小时新增账户数量',
  `login_count` int(11) NOT NULL COMMENT '上一个小时登录账户数量',
  `account_count` int(11) NOT NULL DEFAULT '0' COMMENT '上一个小时登录账户数量',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8278 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_switch`
--

DROP TABLE IF EXISTS `tbl_switch`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_switch` (
  `id` bigint(20) NOT NULL DEFAULT '0' COMMENT '玩家ID',
  `match_on` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否开启排位赛功能, 1表示开启, 0表示禁止',
  `msgboard_mgmt` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否可以删除留言, 1表示可以删除, 0表示不能删除',
  `cik_on` tinyint(4) NOT NULL DEFAULT '0' COMMENT '是否开启实物奖励, 1表示开启, 0表示关闭',
  `cdkey_on` tinyint(4) NOT NULL DEFAULT '0' COMMENT '是否开启兑换码功能, 1表示开启, 0表示禁止',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_user_exception`
--

DROP TABLE IF EXISTS `tbl_user_exception`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_user_exception` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '自增表ID',
  `uid` bigint(20) NOT NULL COMMENT '玩家ID(User ID)',
  `type` smallint(6) NOT NULL COMMENT '异常类型(1:金币异常)',
  `log_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '异常发生时间',
  `exception` text NOT NULL COMMENT '异常内容',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3048034 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_weapon_log`
--

DROP TABLE IF EXISTS `tbl_weapon_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_weapon_log` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `account_id` bigint(20) NOT NULL COMMENT '账户ID',
  `log_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录日志的时间',
  `level_up` int(11) DEFAULT NULL COMMENT '武器升级',
  `level` int(11) DEFAULT NULL COMMENT '武器等级',
  `type` int(11) DEFAULT NULL COMMENT '升级方式: 0-经验, 1-珍珠, 2-VIP',
  `nickname` tinyint(1) NOT NULL DEFAULT '0' COMMENT '玩家是否为昵称账户的标识',
  `vip_weapon_id` varchar(64) DEFAULT NULL COMMENT 'VIP专属炮台ID',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5339117 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2018-03-23 11:52:34
