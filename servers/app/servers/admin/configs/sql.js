module.exports =
    {
        //==========================================================================
        // 通用
        //==========================================================================

        // 获取全服人数
        accountCount: "SELECT COALESCE(count(id), 0) AS sum FROM tbl_account",
        // 查询指定玩家信息
        queryAccount: "select * from tbl_account where id in (uid_list) order by id",
        // 修改指定玩家信息
        modifyAccount: "update tbl_account set target_key=target_value where id in (uid_list)",
        // 根据uid和nickname查询玩家
        getAccountByUidOrNickname: "select * from tbl_account where id=? or nickname=?",
        // 获取数据表列表
        getTableList: "show tables from |db_name| like '%|pattern|%'",
        // 更新数据表字段(tbl_account)
        updateAccount: "update tbl_account set |field|=? where id in (|uid_list|)",


        //==========================================================================
        // 登录
        //==========================================================================

        // 获取管理员信息(通过uid)
        getAccountByUid: "select * from tbl_admin_user where id=?",
        // 管理员使用用户名登录
        getAccountByUname: "select * from tbl_admin_user where uname=? order by id",
        // 查询特殊角色的管理员
        getAccountByRole: "select * from tbl_admin_user where role=? order by id",

        //==========================================================================
        // 统计
        //==========================================================================

        //--------------------------------------------------------------------------
        // 数据生成(尽量把数据用Redis生成)
        //--------------------------------------------------------------------------
        // 获取最近一小时的新增用户数
        getLastHourNewAccount: "SELECT COUNT(id) AS sum FROM tbl_account WHERE created_at>=? AND created_at<=?",
        // 获取最近一小时的登录操作次数
        getLastHourLoginTimes: "SELECT COUNT(account_id) AS sum FROM tbl_login_log WHERE log_at>=? AND log_at<=?",
        getLoginTimes: "SELECT COUNT(id) AS sum FROM tbl_login_log WHERE log_at>=? AND log_at<=?",
        // 获取最近一小时的登录用户数
        getLastHourLoginAccount: "SELECT COUNT(DISTINCT account_id) AS sum FROM tbl_login_log WHERE log_at>=? AND log_at<=?",
        getLoginAccount: "SELECT COUNT(DISTINCT account_id) AS sum FROM tbl_login_log WHERE log_at>=? AND log_at<=?",
        // 插入每小时的统计数据.
        insertHourData: "INSERT INTO tbl_stat_hour (created_at,new_account,login_count,account_count,activeDevice,newDevice,online_count,o1,o2,o3,o4,o5,o6) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?) ",

        // 判断指定日期统计数据是否存在. 使用getDailyData获取结果并查看数组长度
        // 插入每日的统计数据.
        insertDailyData: "INSERT INTO tbl_stat_day (log_date) VALUES (?) ",
        // 更新每日统计数据
        updateDailyData: "UPDATE tbl_stat_day SET |field|=? WHERE log_date=?",

        // 产生指定日期的充值数据
        getTopupData: "SELECT COALESCE(COUNT(game_account_id),0) AS shop_time_count, COALESCE(COUNT(DISTINCT game_account_id),0) AS shop_account_count, COALESCE(SUM(money),0) AS shop_tpa FROM tbl_order where created_at>=? and created_at<=? AND status=0",
        
        // 首次付费玩家查询
        getPafft: "SELECT COALESCE(COUNT(id), 0) AS sum FROM tbl_account WHERE pfft_at>=? AND pfft_at<=?",
        // 首日付费玩家
        getPaffd: "SELECT COALESCE(COUNT(id), 0) AS sum FROM tbl_account WHERE STR_TO_DATE(created_at, '%Y-%m-%d')=? AND STR_TO_DATE(pfft_at, '%Y-%m-%d')=?",

        //--------------------------------------------------------------------------
        // 实时数据
        //--------------------------------------------------------------------------

        // 查询实时数据(选择参数为单一日期)
        realData: "select * from tbl_stat_hour where created_at>=? and created_at<=? order by created_at",
        // 获取历史最高新增
        newAccountMax: "select MAX(new_account) as newAccountMax from tbl_stat_day",
        // 获取历史最高活跃
        activeAccountMax: "select MAX(active_count) as activeAccountMax from tbl_stat_day",
        // 获取历史平均新增
        newAccountAvg: "select ROUND(AVG(new_account)) as newAccountAvg from tbl_stat_day",
        // 获取历史平均活跃
        activeAccountAvg: "select ROUND(AVG(active_count)) as activeAccountAvg from tbl_stat_day",

        //--------------------------------------------------------------------------
        // 留存数据
        //--------------------------------------------------------------------------
        // 查询每日数据(根据传入的日期起始点查询)
        getDailyData: "select * from tbl_stat_day where log_date>=? and log_date<=? order by log_date",
        // 查询每日数据(降序排列)
        getDailyDataDesc: "select * from tbl_stat_day where log_date>=? and log_date<=? order by log_date desc",


        //--------------------------------------------------------------------------
        // 充值排名
        //--------------------------------------------------------------------------
        // 查询充值排名
        topupChart: "select * from tbl_account where rmb>0 order by rmb desc, created_at limit ?,?",
        // 查询充值玩家总数
        topupPlayerCount: "select count(id) as rows from tbl_account where rmb>0",

        //--------------------------------------------------------------------------
        // 付费数据
        //--------------------------------------------------------------------------
        // 获取充值成功订单数据
        getOrderList: "SELECT * FROM tbl_order WHERE status IN (|status|) AND created_at>=? AND created_at<=? LIMIT ?,?",
        getOrderListForUsers: "SELECT * FROM tbl_order WHERE status IN (|status|) AND game_account_id IN (|uid_list|) AND created_at>=? AND created_at<=? LIMIT ?,?",
        orderCount: "SELECT COALESCE(count(id), 0) AS sum FROM tbl_order WHERE status IN (|status|) AND created_at>=? AND created_at<=?",
        orderCountForUsers: "SELECT COALESCE(count(id), 0) AS sum FROM tbl_order WHERE status IN (|status|) AND game_account_id IN (|uid_list|) AND created_at>=? AND created_at<=?",
        getRechargeAll: "select COALESCE(sum(money), 0) as sum from tbl_order where status=0",
        getRechargeUser: "SELECT COALESCE(sum(money), 0) AS sum FROM tbl_order WHERE status=0 AND game_account_id IN (|uid_list|)",

        // 查询充值记录
        getOrderSpecific: "select * from tbl_order where game_account_id=? and card_serial=? and card_code=? order by id",

        // 更新订单状态(status)
        updateOrderStatus: "UPDATE tbl_order SET status=? WHERE id IN (order_id)",

        // 更新订单金额(money)
        updateOrderMoney: "UPDATE tbl_order SET money=? WHERE id IN (order_id)",

        //==========================================================================
        // 游戏数据
        //==========================================================================

        //--------------------------------------------------------------------------
        // 登录日志
        //--------------------------------------------------------------------------
        // 获取金币日志
        getLoginLog: "select * from tbl_login_log where log_at>=? and log_at<=? order by log_at, id limit ?,?",
        // 获取指定日期内所有金币日志总条数
        loginLogCount: "select count(id) as rows from tbl_login_log where log_at>=? and log_at<=?",
        // 获取指定玩家金币日志
        getPlayerLoginLog: "select * from tbl_login_log where account_id in (uid_list) and log_at>=? and log_at<=? order by log_at, id limit ?,?",
        // 获取指定玩家指定日期内所有金币日志总条数
        playerLoginLogCount: "select count(id) as rows from tbl_login_log where account_id in (uid_list) and log_at>=? and log_at<=?",

        //--------------------------------------------------------------------------
        // 金币日志
        //--------------------------------------------------------------------------
        // 获取金币日志
        getGoldLog: "select * from tbl_gold_log where log_at>=? and log_at<=? order by log_at, id limit ?,?",
        // 获取指定日期内所有金币日志总条数
        goldLogCount: "select count(id) as rows from tbl_gold_log where log_at>=? and log_at<=?",
        // 获取指定玩家金币日志
        getPlayerGoldLog: "select * from tbl_gold_log where account_id in (uid_list) and log_at>=? and log_at<=? order by log_at, id limit ?,?",
        // 获取指定玩家指定日期内所有金币日志总条数
        playerGoldLogCount: "select count(id) as rows from tbl_gold_log where account_id in (uid_list) and log_at>=? and log_at<=?",

        // 获取金币日志
        getGoldLogHistory: "select * from fishjoy_bak.tbl_gold_log_|date|_|index| order by log_at, id limit ?,?",
        // 获取指定日期内所有金币日志总条数
        goldLogCountHistory: "select count(id) as rows from fishjoy_bak.tbl_gold_log_|date|_|index|",
        // 获取指定玩家金币日志(历史-今日以前)
        getPlayerGoldLogHistory: "select * from fishjoy_bak.tbl_gold_log_|date|_|index| where account_id in (uid_list) order by log_at, id limit ?,?",
        // 获取指定玩家指定日期内所有金币日志总条数(历史-今日以前)
        playerGoldLogCountHistory: "select count(id) as rows from fishjoy_bak.tbl_gold_log_|date|_|index| where account_id in (uid_list)",


        //--------------------------------------------------------------------------
        // 通用日志
        //--------------------------------------------------------------------------
        // 通用获取log方法
        getCommonLog: "select * from |table_name| where log_at>=? and log_at<=? |extra_condition| order by log_at, id limit ?,?",
        getCommonLogHistory: "select * from |table_name| where true |extra_condition| order by log_at, id limit ?,?",
        getCommonLogCount: "select count(id) as rows from |table_name| where log_at>=? and log_at<=? |extra_condition|",
        getCommonLogCountHistory: "select count(id) as rows from |table_name| where true |extra_condition|",

        //--------------------------------------------------------------------------
        // 金币数据
        //--------------------------------------------------------------------------
        // 今日金币数据查询
        getGoldData: "SELECT sum(|type|) as sum FROM tbl_gold_log WHERE scene=? AND log_at>=? AND log_at<=?",
        // 历史金币数据查询
        getGoldDataHistory: "SELECT * FROM tbl_stat_hour_gold WHERE time>=? AND time<=? order by time",
        // 历史金币数据查询
        getGoldGainCostAll: "SELECT COALESCE(sum(totalGain), 0) as gain, COALESCE(sum(totalCost), 0) as cost FROM tbl_stat_hour_gold",


        //==========================================================================
        // 游戏管理
        //==========================================================================

        //--------------------------------------------------------------------------
        // 邮件管理
        //--------------------------------------------------------------------------

        // 获取邮件列表
        getMailData: "select * from tbl_mail where sendtime>=? and sendtime<=? order by sendtime",
        getMailDataWithId: "select * from tbl_mail where id in (|mid_list|) and sendtime>=? and sendtime<=? order by sendtime",
        // 删除邮件
        delMail: 'update tbl_mail set status=0 where id=?',
        // 插入邮件
        insertMail: 'INSERT INTO tbl_mail (type, content, reward, title, receiverUid, receiver, validtime, addByWho) VALUES (?,?,?,?,?,?,?,?)',

        //--------------------------------------------------------------------------
        // 礼品码管理
        //--------------------------------------------------------------------------

        // 获取礼品码列表
        getGiftCodeList: "select created_at, count(id) as num, sum(usedNum) as usedCount, `limit`, action_id, addByWho, cd_key from tbl_cd_key group by created_at order by created_at desc",
        // 获取礼品码数据
        getGiftCodeData: "select * from tbl_cd_key where cd_key in (|giftCode|) order by id",
        // 下载一个批次的礼品码
        downloadGiftCodeList: "select * from tbl_cd_key where created_at=? order by id",


        //==========================================================================
        // 运营管理
        //==========================================================================

        //--------------------------------------------------------------------------
        // 实物兑换
        //--------------------------------------------------------------------------

        // 获取实物兑换订单
        getChangeLog: "select * from tbl_change_log where created_at>=? and created_at<=? and catalog in (|catalog|) and status in (|status|) order by created_at limit ?,?",
        // 获取实物兑换订单的数量
        getChangeLogCount: "select count(id) as rows from tbl_change_log where created_at>=? and created_at<=? and catalog in (|catalog|) and status in (|status|)",
        // 获取指定玩家的实物兑换订单
        getChangeLogOfUser: "select * from tbl_change_log where created_at>=? and created_at<=? and uid in (|uid_list|) and catalog in (|catalog|) and status in (|status|) order by created_at limit ?,?",
        // 获取指定玩家的实物兑换订单的数量
        getChangeLogOfUserCount: "select count(id) as rows from tbl_change_log where created_at>=? and created_at<=? and uid in (|uid_list|) and catalog in (|catalog|) and status in (|status|)",
        // 获取提现订单
        getChangeLogByOrderId: "select * from tbl_change_log where orderid=?",
        
        // 提现订单相关
        // 指定日期内提现成功的次数
        getCashCount: "select COALESCE(count(id),0) as sum from tbl_change_log where status=2 and catalog=1 and created_at>=? and created_at<=?",
        // 指定日期内提现成功的人数
        getCashAccount: "select COALESCE(count(distinct uid),0) as sum from tbl_change_log where status=2 and catalog=1 and created_at>=? and created_at<=?",
        // 指定日期内提现成功的总金额
        getCashSum: "select COALESCE(sum(cost),0) as sum from tbl_change_log where status=2 and catalog=1 and created_at>=? and created_at<=?",
        // 历史提现成功的总金额
        getCashSumAll: "select COALESCE(sum(cost),0) as sum from tbl_change_log where status=2 and catalog=1",

        // 更新提现数据-状态
        updateStatus: "update tbl_change_log set status=? where orderid=?",
        // 更新提现数据-发货时间
        updateShiptime: "update tbl_change_log set ship_at=? where orderid=?",
        // 更新提现数据-卡号卡密
        updateCard: "update tbl_change_log set card_num=?, card_pwd=? where orderid=?",
        // 更新实物兑换数据-收件人和地址
        updateReceiverAndAddress: "update tbl_change_log set receiver=?, address=? where orderid=?",
        // 更新实物兑换数据-物流公司和单号
        updateWayAndNum: "update tbl_change_log set way=?, thingnum=? where orderid=?",

        //--------------------------------------------------------------------------
        // 服务器数据
        //--------------------------------------------------------------------------
        // 获取历史充值总额
        rechargeHistory: "select COALESCE(SUM(shop_tpa),0) as sum from tbl_stat_day",
        // 获取近一周充值总额
        rechargeWeek: "select COALESCE(SUM(shop_tpa),0) as sum from tbl_stat_day where log_date >= date_sub(now(),interval 7 day)",
        // 获取历史提现总额
        cashHistory: "select COALESCE(SUM(cash),0) as sum from tbl_stat_day",
        // 获取近一周提现总额
        cashWeek: "select COALESCE(SUM(cash),0) as sum from tbl_stat_day where log_date >= date_sub(now(),interval 7 day)",
        // 获取历史提现总额
        cashHistory1: "SELECT ROUND(COALESCE(SUM(cost),0) / 3.75) as sum from tbl_change_log where status=2 and catalog=1",
        // 获取近一周提现总额
        cashWeek1: "SELECT ROUND(COALESCE(SUM(cost),0) / 3.75) as sum from tbl_change_log where status=2 and catalog=1 and ship_at >= date_sub(now(),interval 7 day)",

        //--------------------------------------------------------------------------
        // 玩家数据
        //--------------------------------------------------------------------------
        // 获取所有玩家最近一小时开火数
        getFire1Hour: "select COALESCE(SUM(fire),0) as sum from tbl_gold_log where log_at >= date_sub(now(),interval 1 hour)",
        // 获取指定玩家最近一小时开火数
        getFire1HourPlayer: "select COALESCE(SUM(fire),0) as sum from tbl_gold_log where account_id=? and log_at >= date_sub(now(),interval 1 hour)",
        // 获取玩家最近一小时盈利(gain - cost)
        getProfit1Hour: "select sum(gain)-sum(cost) as sum from tbl_gold_log where account_id=? and log_at >= date_sub(now(),interval 1 hour)",
        // 获取玩家最近一小时获取金币数
        getGain1HourFishing: "select COALESCE(SUM(gain),0) as sum from tbl_gold_log where scene in (|scene|) and log_at >= date_sub(now(),interval 1 hour)",
        // 获取指定玩家最近一小时获取金币数
        getGain1HourFishingPlayer: "select COALESCE(SUM(gain),0) as sum from tbl_gold_log where scene in (|scene|) and account_id=? and log_at >= date_sub(now(),interval 1 hour)",
        // 获取玩家最近一小时消耗金币数
        getCost1HourFishing: "select COALESCE(SUM(cost),0) as sum from tbl_gold_log where scene in (|scene|) and log_at >= date_sub(now(),interval 1 hour)",
        // 获取指定玩家最近一小时消耗金币数
        getCost1HourFishingPlayer: "select COALESCE(SUM(cost),0) as sum from tbl_gold_log where scene in (|scene|) and account_id=? and log_at >= date_sub(now(),interval 1 hour)",

        //==========================================================================
        // 后台管理
        //==========================================================================

        //--------------------------------------------------------------------------
        // 运营账号管理
        //--------------------------------------------------------------------------

        // 获取运营人员列表
        getOperator: "select * from tbl_admin_user where role=100 order by id",
        // 检查管理人员用户名是否已经存在
        checkOperator: "select * from tbl_admin_user where uname=?",
        // 添加运营人员
        addOperator: "insert into tbl_admin_user (uname, token, salt, password, role) values (?, ?, ?, ?, 100)",
        // 切换管理员权限
        switchValid: "update tbl_admin_user set valid=? where uname=?",
        // 修改管理员密码
        modifyPwd: "update tbl_admin_user set salt=?, password=? where uname=?",
    };