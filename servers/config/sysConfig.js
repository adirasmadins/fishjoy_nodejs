const versions = require('./versions');

module.exports = {
    GAME_TYPE: 'fish',
    //负载均衡服负载信息拉取周期
    BALANCE_PERIOD:3000, //ms,默认10000
    
    //平台数据配置
    PLATFORM_DATA_CONF:{
        PUMPWATER:{
            RANGE:[0.65, 1.5],
            DEFAULT:1
        },
        PLATFORM_CATCHRATE:{
            RANGE:[0.5, 1.5],
            DEFAULT:1
        },
        PLAYER_CATCH_RATE:{
            RANGE:[0.5, 1.5],
            DEFAULT:1
        },
        SCENE_CATCHRATE:{
            RANGE:[0.5, 1.5],
            DEFAULT:1
        },
    },
    
    PLATFORM:{
        ANDROID:1,
        IOS:2,
        PC:3,
    },
};

if(versions.SSL){
    module.exports.SSL_CERT = {
        KEY:`shared/cert/${versions.VER_KEY[versions.PUB]}/server.key`,
        CERT:`shared/cert/${versions.VER_KEY[versions.PUB]}/server.crt`,
    };
}

