const GAMEPLAY = {
    LOCAL: 0, //测试
    WANBA: 1, //大陆
    VIETNAM: 2, //越南
    IOS: 3, //大陆IOS
    VIETNAM_VN: 4, //越南VN
    GOOGLE: 5,
    COCO: 6,//17525平台
    VIETNAM_VN_TEST: 7,//越南VN测试版
};

module.exports = {
    //游戏发行版本
    //发布时，
    //检查hall buzz_pay.js 64行的支付是否关闭
    DEVELOPMENT: true,  //发布时修改为false
    PUB: GAMEPLAY.VIETNAM_VN,
    SSL: false, //是否启动SSL

    //游戏发行版本类型定义
    GAMEPLAY: GAMEPLAY,
    //版本标识KEY
    VER_KEY: [
        'local',
        'wanba',
        'vietnam',
        'ios',
        'vietnam_vn',
        'google',
        'coco',
        'vietnam_vn_test',
    ],

    CHEAT_BROKEN: [GAMEPLAY.VIETNAM_VN, GAMEPLAY.VIETNAM, GAMEPLAY.VIETNAM_VN_TEST],
    WWW_DOMAIN: [GAMEPLAY.VIETNAM, GAMEPLAY.VIETNAM_VN, GAMEPLAY.IOS],
    PLATFORM_DIVISION: [GAMEPLAY.WANBA],
    REDIRECT_HTTPS:[GAMEPLAY.VIETNAM_VN,GAMEPLAY.VIETNAM]

};