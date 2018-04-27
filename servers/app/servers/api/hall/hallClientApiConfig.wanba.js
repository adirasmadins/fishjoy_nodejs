const data_gift = require('../../hall/controllers/data/gift');

module.exports = {
    get_adv_gift: {
        route: '/get_adv_gift', //玩吧领取每日广告礼包
        handler: data_gift.getAdvGift,
        params: [],
        accountFields: []
    }
};