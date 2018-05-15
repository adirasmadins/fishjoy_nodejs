module.exports = {
    /**
     * 非活跃用户数据移除redis,存入到mysql
     * TODO month_sign_extra_reward字段未同步，踢人时间周期小于一个月会导致签到奖励重复领取
     */
    userKick: {
        enable: true,
        // time: '0,0,3,*,*,*', //每天3点
        time: '0,0,*/1,*,*,*', //每小时
        // time: '*/10,*,*,*,*,*', //每小时
        active_timeout: 30,
        readLimit: 1000,
        writeLimit: 100,
    },

    /**
     * 玩家游戏数据实时同步到mysql
     */
    userSync: {
        enable: true,
        time: '*/10,*,*,*,*,*',
        readLimit: 1000,
        writeLimit: 100,
    }
};