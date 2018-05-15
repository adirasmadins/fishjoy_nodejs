const data_recieve = require('../../pay/controllers/data/recieve');
const data_cdkey = require('../../pay/controllers/data/cd_key');
const data_draw = require('../../pay/controllers/data/draw');
const data_mail = require('../../pay/controllers/data/mail');
const data_reward = require('../../pay/controllers/data/reward');
const month_card = require('../../pay/controllers/data/month_card');
const pack = require('../../pay/controllers/data/pack');
const first_recharge = require('../../pay/controllers/data/first_recharge');
const data_pay = require('../../pay/controllers/data/pay');

const api_list = {
    buy: {
        route: '/buy',  //渠道支付
        handler: data_pay.buy,
        params: [],
        accountFields: [],
        ext: {
            getIp: function (ctx) {
                ctx.request.body.data = ctx.request.body.data || {};
                ctx.request.body.data.userIp = ctx.ip;
            }
        }
    }, get_game_order: {
        route: '/get_game_order', //获取游戏物品订单(包括订单号等).
        handler: data_pay.getPayorder,
        params: [],
        accountFields: []
    }, change_in_kind: {
        route: '/change_in_kind', //实物兑换
        handler: data_recieve.changeInKind,
        params: [],
        accountFields: []
    }, get_cik_info: {
        route: '/get_cik_info', //获取实物兑换的信息
        handler: data_recieve.getCikInfo,
        params: [],
        accountFields: []
    }, get_cik_log: {
        route: '/get_cik_log', //获取实物兑换的日志信息
        handler: data_recieve.getCikLog,
        params: [],
        accountFields: []
    }, cancel_cik: {
        route: '/cancel_cik', //取消实物订单
        handler: data_recieve.cancelCik,
        params: [],
        accountFields: []
    }, use_cdkey: {
        route: '/use_cdkey', //使用CD-KEY
        handler: data_cdkey.use,
        params: [],
        accountFields: []
    }, get_draw: {
        route: '/get_draw', //幸运大抽奖(测试OK)
        handler: data_draw.getDraw,
        params: [],
        accountFields: []
    }, turntable_draw: {
        route: '/turntable_draw', //转盘抽奖
        handler: data_recieve.turntableDraw,
        params: [],
        accountFields: []
    }, buy_vip_gift: {
        route: '/buy_vip_gift', //购买VIP礼包
        handler: data_recieve.buyVipGift,
        params: [],
        accountFields: []
    }, vip_daily_reward: {
        route: '/vip_daily_reward', //领取VIP每日奖励(测试OK)
        handler: data_recieve.vipDailyReward,
        params: [],
        accountFields: []
    }, read_mail: {
        route: '/read_mail', //领取邮件奖励
        handler: data_mail.readMail,
        params: [],
        accountFields: []
    }, get_bankruptcy_compensation: {
        route: '/get_bankruptcy_compensation', //领取破产补偿，每天可以获取5次，每次1000金币
        handler: data_reward.get_bankruptcy_compensation,
        params: [],
        accountFields: []
    }, month_card_reward: {
        route: '/month_card_reward', //每日领取月卡奖励
        handler: month_card.reward,
        params: [],
        accountFields: []
    }, pack_mix: {
        route: '/pack_mix', //背包合成
        handler: pack.mix,
        params: [],
        accountFields: []
    }, pack_use: {
        route: '/pack_use', //背包使用
        handler: pack.use,
        params: [],
        accountFields: []
    }, first_recharge_reward: {
        route: '/first_recharge_reward', //首充奖励领取
        handler: first_recharge.reward,
        params: [],
        accountFields: []
    }
};

module.exports = {
    apiCfgs: api_list,
    PREFIX: '/pay/clientApi',
};