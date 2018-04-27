const info = require('../../hall/controllers/data/info');

module.exports = {
    open_rank: {
        route: '/open_rank', //是否打开排行榜
        handler: info.openRank,
        params: [],
        accountFields: []
    }
};