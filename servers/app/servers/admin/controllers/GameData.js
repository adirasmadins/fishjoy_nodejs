const tools = require('../../../utils/tools');
const ask = require('../../common/logicResponse').ask;
const handler = require('../services/gamedata/handler');

class GameData {

    async goldData(data, ctx) {
        tools.BuzzUtil.checkFields(data, 'goldData');
        let ret = await handler.goldData.get(data, ctx);
        return ask(ret);
    }

    async loginLog(data, ctx) {
        tools.BuzzUtil.checkFields(data, 'loginLog');
        let ret = await handler.loginLog.get(data, ctx);
        return ask(ret);
    }

    async playerData(data, ctx) {
        tools.BuzzUtil.checkFields(data, 'playerData');
        let ret = await handler.playerData.get(data, ctx);
        return ask(ret);
    }

    async freezePlayer(data, ctx) {
        tools.BuzzUtil.checkFields(data, 'freezePlayer');
        let ret = await handler.freezePlayer.get(data, ctx);
        return ask(ret);
    }

    async activityLog(data, ctx) {
        tools.BuzzUtil.checkFields(data, 'activityLog');
        let ret = await handler.activityLog.get(data, ctx);
        return ask(ret);
    }

    async goldLog(data, ctx) {
        tools.BuzzUtil.checkFields(data, 'goldLog');
        let ret = await handler.goldLog.get(data, ctx);
        return ask(ret);
    }

    async itemLog(data, ctx) {
        tools.BuzzUtil.checkFields(data, 'itemLog');
        // let ret = require("./temp/gamedata/itemLog").fake1;
        let ret = await handler.itemLog.get(data, ctx);
        return ask(ret);
    }

    async goddessLog(data, ctx) {
        tools.BuzzUtil.checkFields(data, 'goddessLog');
        let ret = await handler.goddessLog.get(data, ctx);
        return ask(ret);
    }

    async getFreezeReasonList(data, ctx) {
        tools.BuzzUtil.checkFields(data, 'getFreezeReasonList');
        let ret = await handler.getFreezeReasonList.get(data, ctx);
        return ask(ret);
    }
}

module.exports = new GameData();