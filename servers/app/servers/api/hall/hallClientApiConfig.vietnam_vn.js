const data_goddess = require('../../hall/controllers/data/goddess');

module.exports = {
    goddess_interact_reward: {
        route: '/goddess_interact_reward', //女神互动奖励(爱抚女神获取奖励)
        handler: data_goddess.interractReward,
        params: [],
        accountFields: []
    }
};