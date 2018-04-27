module.exports = {
    /**
     * 每分钟定时任务
     */
    oneMinute: {
        enable: true,
        time: '0,*/1,*,*,*,*',
    },

    /**
     * 定时统计十分钟内在线人数
     */
    onlineTenMinutes: {
        enable: true,
        time: '0,*/10,*,*,*,*',
    },

    /**
     * 定时统计一小时内在线人数
     */
    onlineOneHour: {
        enable: true,
        time: '0,0,*,*,*,*',
    },

    /**
     * 每天统计一次数据
     */
    oneDay: {
        enable: true,
        time: '5,0,0,*,*,*',
    },

    /**
     * 每天定时任务处理不及时数据
     */
    oneDayIdle: {
        enable: true,
        time: '0,0,4,*,*,*',
    }
};