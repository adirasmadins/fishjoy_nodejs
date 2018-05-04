module.exports = {
    appid:'wxfece06b250c43b30',
    appkey:'951b9dc8e68065c72a57bd5a917c3307',
    offer_id:'1450014752',
    getAccessToken:'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=%s&secret=%s',
    // midas_appKey:'sLSwZFHLzNSsS0keKthlM6nVbK5Jcf2j', //正式
    midas_appKey:'mG3RyOCbrgytXzTU43fpbDtCdLDpmdto', //沙箱
    //扣除玩家游戏币
    // MIDASPAY:'https://api.weixin.qq.com/cgi-bin/midas/pay?access_token=%s',
    MIDASPAY:'https://api.weixin.qq.com/cgi-bin/midas/sandbox/pay?access_token=%s',
    // MIDASPAY_ORG_LOC:'/cgi-bin/midas/pay',
    MIDASPAY_ORG_LOC:'/cgi-bin/midas/sandbox/pay',
};