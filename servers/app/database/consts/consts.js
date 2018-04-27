module.exports = {
    DBType:{
        MYSQL:0,
        REDIS:1,
        MONGO:2,
        checkValid:function (dbtype) {
            switch (dbtype){
                case module.exports.DBType.REDIS:
                case module.exports.DBType.MYSQL:
                case module.exports.DBType.MONGO:
                    return true;
                default:
                    return false;
            }
        }
    },

    ACCOUNT_EVENT_TYPE:{
        GAIN_LOST:0,
        DATA_SYNC:1,
        MISSION:2,
        PLAYER_DATA_CHANGE_SYNC:3, //玩家重要数据同步
    }
};