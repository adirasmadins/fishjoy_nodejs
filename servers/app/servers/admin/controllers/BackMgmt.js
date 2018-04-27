const tools = require('../../../utils/tools');
const ask = require('../../common/logicResponse').ask;
const handler = require('../services/backmgmt/handler');

class BackMgmt {

    async getOperator(data, ctx) {
        tools.BuzzUtil.checkFields(data, 'getOperator');
        let ret = await handler.getOperator.get(data, ctx);
        return ask(ret);
    }

    async addOperator(data, ctx) {
        tools.BuzzUtil.checkFields(data, 'addOperator');
        let ret = await handler.addOperator.get(data, ctx);
        return ask(ret);
    }

    async modifyOperatorPassword(data, ctx) {
        tools.BuzzUtil.checkFields(data, 'modifyOperatorPassword');
        let ret = await handler.modifyOperatorPassword.get(data, ctx);
        return ask(ret);
    }

    async authSwitch(data, ctx) {
        tools.BuzzUtil.checkFields(data, 'authSwitch');
        let ret = await handler.authSwitch.get(data, ctx);
        return ask(ret);
    }

    async generateDailyData(data, ctx) {
        tools.BuzzUtil.checkFields(data, 'generateDailyData');
        let ret = await handler.generateDailyData.get(data, ctx);
        return ask(ret);
    }

    async getServerSwitch(data, ctx) {
        tools.BuzzUtil.checkFields(data, 'getServerSwitch');
        let ret = await handler.getServerSwitch.get(data, ctx);
        return ask(ret);
    }

    async serverSwitch(data, ctx) {
        tools.BuzzUtil.checkFields(data, 'serverSwitch');
        let ret = await handler.serverSwitch.get(data, ctx);
        return ask(ret);
    }

    async rmbVipCorrect(data, ctx) {
        tools.BuzzUtil.checkFields(data, 'rmbVipCorrect');
        let ret = await handler.rmbVipCorrect.excute(data, ctx);
        return ask(ret);
    }

    async resetCikDailyLeft(data, ctx) {
        tools.BuzzUtil.checkFields(data, 'resetCikDailyLeft');
        let DailyTask = require('../services/task/DailyTask');
        await DailyTask.resetCikDailyLeft();
        return ask({ result: true });
    }

}

module.exports = new BackMgmt();