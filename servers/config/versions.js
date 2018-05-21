const GAMEPLAY = {
    LOCAL: 0, //测试
    WANBA: 1, //大陆
    VIETNAM: 2, //越南
    IOS: 3, //大陆IOS
    VIETNAM_VN: 4, //越南VN
    GOOGLE: 5,
    COCO: 6,//17525平台
    VIETNAM_VN_TEST: 7,//越南VN测试版
    WECHAT:8, //微信小游戏
};

const VER_KEY = [
    'local',
    'wanba',
    'vietnam',
    'ios',
    'vietnam_vn',
    'google',
    'coco',
    'vietnam_vn_test',
    'wechat',
];

const CDN_DOMAIN = {};
CDN_DOMAIN[GAMEPLAY.VIETNAM_VN] = "vncdn1.secureswiftcontent.com";

module.exports = {
    //配置游戏发行版本
    DEVELOPMENT: true,  //发布时修改为false
    PUB: GAMEPLAY.WANBA, //设置发布版本类型
    SSL: false, //是否启动SSL

    //游戏发行版本类型定义
    GAMEPLAY: GAMEPLAY,
    //版本标识KEY
    VER_KEY:VER_KEY,

    CDN_DOMAIN:CDN_DOMAIN,

    IMG_DISPATCHER:[
        GAMEPLAY.WANBA
    ],


    WWW_DOMAIN: [
        GAMEPLAY.VIETNAM,
        GAMEPLAY.VIETNAM_VN,
        GAMEPLAY.IOS,
        GAMEPLAY.WECHAT,
    ],

    PLATFORM_DIVISION: [
        GAMEPLAY.WANBA
    ],

    REDIRECT_HTTPS: [
        GAMEPLAY.VIETNAM_VN,
        GAMEPLAY.VIETNAM
    ],

    VERSION_CHINA: [
        GAMEPLAY.LOCAL,
        GAMEPLAY.WANBA,
        GAMEPLAY.IOS,
        GAMEPLAY.GOOGLE,
        GAMEPLAY.COCO
    ],

    VERSION_VIETNAM: [
        GAMEPLAY.VIETNAM,
        GAMEPLAY.VIETNAM_VN,
        GAMEPLAY.VIETNAM_VN_TEST
    ],

    VERSION_GAMBLING: [
        GAMEPLAY.VIETNAM
    ],

    VERSION_CIK_BY_HAND: [
        GAMEPLAY.WANBA,
        GAMEPLAY.VIETNAM_VN,
        GAMEPLAY.VIETNAM_VN_TEST,
        GAMEPLAY.LOCAL,
        GAMEPLAY.IOS,
        GAMEPLAY.GOOGLE,
        GAMEPLAY.COCO
    ]

};