const tools = require('../../../utils/tools');
const ask = require('../../common/logicResponse').ask;
const handler = require('../services/statistics/handler');

class Statistics {

    async realData(data, ctx) {
        tools.BuzzUtil.checkFields(data, 'realData');
        let ret = await handler.realData.get(data, ctx);
        return ask(ret);
    }

    async retentionData(data, ctx) {
        tools.BuzzUtil.checkFields(data, 'retentionData');
        let ret = await handler.retentionData.get(data, ctx);
        return ask(ret);
    }

    async topupData(data, ctx) {
        tools.BuzzUtil.checkFields(data, 'topupData');
        let ret = await handler.topupData.get(data, ctx);
        return ask(ret);
    }

    async topupLog(data, ctx) {
        tools.BuzzUtil.checkFields(data, 'topupLog');
        let ret = await handler.topupLog.get(data, ctx);
        return ask(ret);
    }

    async topupChart(data, ctx) {
        tools.BuzzUtil.checkFields(data, 'topupChart');
        let ret = await handler.topupChart.get(data, ctx);
        return ask(ret);
    }
}

module.exports = new Statistics();