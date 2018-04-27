module.exports = {
    //facebook平台用户登录
    login: {
        device: 1, //设备平台:1 android 2 ios 3 web
        sdkAuthResponse: { //第三方平台登录返回信息
            accessToken: 'accessToken',
            userID: '',
            expiresIn: 4952,
            signedRequest: 'signedRequest'
        },
        channel: 0 //0：test,1:QQ,2:EGRET,3:WECHAT,4:FACEBOOK
    },

    //退出游戏
    logout: {
        accessToken:'accessToken',
        platformType: 0
    }
};