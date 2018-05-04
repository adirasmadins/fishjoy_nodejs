const FacebookUser = require('./facebookUser');
const InnerUser = require('./innerUser');
const WanbaUser = require('./wanbaUser');
const EgretUser = require('./egretUser');
const CocoUser = require('./cocoUser');
const GooglePlusUser = require('./googlePlusUser');
const WechatUser = require('./wechatUser');

module.exports = {
    PLATFORM_CONFIG: {
        1001: {
            Class:EgretUser,
            sdk:{
                host:'',
                appId: '90866',
                appSecret: 'wcCKDghgzbDqlPosikMnr',
                timeout: 5000
            }

        },
        1002: {
            Class:WanbaUser,
            sdk:{
                host:'http://openapi.tencentyun.com',
                appId: '1105938023',
                appSecret: 'b5U7V8gXW2XvGz7k',
                timeout: 5000,
                uri:{
                    get_info:'/v3/user/get_info',
                    buy_playzone_item:'/v3/user/buy_playzone_item',
                    is_login:'/v3/user/is_login',
                    get_app_friends:'/v3/relation/get_app_friends',
                    report_user_achievement:'/v3/gamebar/report_user_achievement',
                    send_gamebar_msg:'v3/user/send_gamebar_msg',
                }
            }

        },
        1003: {
            Class:FacebookUser,
            sdk:{
                url:'https://graph.facebook.com/v2.11',
                appId: '166435350758141',
                appSecret: 'c8b601148a0040f4fb1050a860bf8eb0',
                timeout: 5000
            }

        },
        1004:{
            Class:GooglePlusUser,
            sdk:{}
        },
        1005: {
            Class:InnerUser,
            sdk:{}
        },
        1006: {
            Class:CocoUser,
            sdk:{
                url:'http://www.17525.com/user/info',
                gameid:''
            }
        },
        1007: {
            Class:WechatUser,
            sdk:{
                url:'https://api.weixin.qq.com/sns/jscode2session?appid=%s&secret=%s&js_code=%s&grant_type=authorization_code',
                appid:'wxfece06b250c43b30',
                secret:'951b9dc8e68065c72a57bd5a917c3307'
            }
        }
    }
};