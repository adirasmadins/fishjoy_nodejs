const tools = require('../../../utils/tools');
const ask = require('../../common/logicResponse').ask;
const handler = require('../services/operation/handler');

class Operation {

    async getChangeLog(data, ctx) {
        tools.BuzzUtil.checkFields(data, 'getChangeLog');
        // let ret = require("./temp/operation/getChangeLog").fake1;
        let ret = await handler.getChangeLog.get(data, ctx);
        return ask(ret);
    }

    async confirmChange(data, ctx) {
        tools.BuzzUtil.checkFields(data, 'confirmChange');
        // let ret = require("./temp/operation/confirmChange").fake1;
        let ret = await handler.confirmChange.get(data, ctx);
        return ask(ret);
    }

    async cancelChange(data, ctx) {
        tools.BuzzUtil.checkFields(data, 'cancelChange');
        // let ret = require("./temp/operation/cancelChange").fake1;
        let ret = await handler.cancelChange.get(data, ctx);
        return ask(ret);
    }

    async queryJackpot(data, ctx) {
        tools.BuzzUtil.checkFields(data, 'queryJackpot');
        let ret = await handler.queryJackpot.get(data, ctx);
        return ask(ret);
    }

    async queryServerPeriod(data, ctx) {
        tools.BuzzUtil.checkFields(data, 'queryServerPeriod');
        let ret = await handler.queryServerPeriod.get(data, ctx);
        return ask(ret);
    }

    async queryPlayer(data, ctx) {
        tools.BuzzUtil.checkFields(data, 'queryPlayer');
        let ret = await handler.queryPlayer.get(data, ctx);
        return ask(ret);
    }

    async getCashData(data, ctx) {
        tools.BuzzUtil.checkFields(data, 'getCashData');
        let ret = await handler.getCashData.get(data, ctx);
        return ask(ret);
    }

    async getProfitChart(data, ctx) {
        tools.BuzzUtil.checkFields(data, 'getProfitChart');
        let ret = await handler.getProfitChart.get(data, ctx);
        return ask(ret);
    }

    async changeCatchRate(data, ctx) {
        tools.BuzzUtil.checkFields(data, 'changeCatchRate');
        let ret = await handler.changeCatchRate.get(data, ctx);
        return ask(ret);
    }

    async changeQueryServerPeriod(data, ctx) {
        tools.BuzzUtil.checkFields(data, 'changeQueryServerPeriod');
        let ret = await handler.changeQueryServerPeriod.get(data, ctx);
        return ask(ret);
    }

    async getPlayerData(data, ctx) {
        tools.BuzzUtil.checkFields(data, 'getPlayerData');
        let ret = await handler.getPlayerData.get(data, ctx);
        return ask(ret);
    }

    async modifyPlayerData(data, ctx) {
        tools.BuzzUtil.checkFields(data, 'modifyPlayerData');
        let ret = await handler.modifyPlayerData.get(data, ctx);
        return ask(ret);
    }
    
    async getFireData(data, ctx) {
        tools.BuzzUtil.checkFields(data, 'getFireData');
        let ret = await handler.getFireData.get(data, ctx);
        return ask(ret);
    }
    
    async getSceneCatchRateList(data, ctx) {
        tools.BuzzUtil.checkFields(data, 'getSceneCatchRateList');
        let ret = await handler.getSceneCatchRateList.get(data, ctx);
        return ask(ret);
    }
    
    async modifySceneCatchRate(data, ctx) {
        tools.BuzzUtil.checkFields(data, 'modifySceneCatchRate');
        let ret = await handler.modifySceneCatchRate.get(data, ctx);
        return ask(ret);
    }

}

module.exports = new Operation();