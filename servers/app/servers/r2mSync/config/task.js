module.exports = {
    /**
     * 非活跃用户数据移除redis,存入到mysql
     */
    userKick: {
        enable: true,
        // time: '0,0,3,*,*,*', //每天3点
        time: '0,0,*/1,*,*,*', //每小时
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