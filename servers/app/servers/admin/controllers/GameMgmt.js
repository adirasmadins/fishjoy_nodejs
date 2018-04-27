const tools = require('../../../utils/tools');
const ask = require('../../common/logicResponse').ask;
const handler = require('../services/gamemgmt/handler');

class GameMgmt {

    async cashRequire(data, ctx) {
        tools.BuzzUtil.checkFields(data, 'cashRequire');
        // let ret = require("./temp/gamemgmt/cashRequire").fake1;
        let ret = await handler.cashRequire.get(data, ctx);
        return ask(ret);
    }

    async cashRequireQuery(data, ctx) {
        tools.BuzzUtil.checkFields(data, 'cashRequireQuery');
        let ret = await handler.cashRequireQuery.get(data, ctx);
        return ask(ret);
    }

    async genGiftCode(data, ctx) {
        tools.BuzzUtil.checkFields(data, 'genGiftCode');
        let ret = await handler.genGiftCode.get(data, ctx);
        return ask(ret);
    }

    async getGiftCodeConfig(data, ctx) {
        tools.BuzzUtil.checkFields(data, 'getGiftCodeConfig');
        let ret = await handler.getGiftCodeConfig.get(data, ctx);
        return ask(ret);
    }

    async getGiftCodeData(data, ctx) {
        tools.BuzzUtil.checkFields(data, 'getGiftCodeData');
        let ret = await handler.getGiftCodeData.get(data, ctx);
        return ask(ret);
    }
    
    async getGiftCodeList(data, ctx) {
        tools.BuzzUtil.checkFields(data, 'getGiftCodeList');
        let ret = await handler.getGiftCodeList.get(data, ctx);
        return ask(ret);
    }
    
    async downloadGiftCodeList(data, ctx) {
        tools.BuzzUtil.checkFields(data, 'downloadGiftCodeList');
        let ret = await handler.downloadGiftCodeList.get(data, ctx);
        return ask(ret, 3);
    }

    async addBroadcast(data, ctx) {
        tools.BuzzUtil.checkFields(data, 'addBroadcast');
        let ret = await handler.addBroadcast.get(data, ctx);
        return ask(ret);
    }

    async getBroadcast(data, ctx) {
        tools.BuzzUtil.checkFields(data, 'getBroadcast');
        let ret = await handler.getBroadcast.get(data, ctx);
        return ask(ret);
    }

    async cancelBroadcast(data, ctx) {
        tools.BuzzUtil.checkFields(data, 'cancelBroadcast');
        let ret = await handler.cancelBroadcast.get(data, ctx);
        return ask(ret);
    }

    async sendMail(data, ctx) {
        tools.BuzzUtil.checkFields(data, 'sendMail');
        let ret = await handler.sendMail.get(data, ctx);
        return ask(ret);
    }

    async sendMailCompensation(data, ctx) {
        tools.BuzzUtil.checkFields(data, 'sendMailCompensation');
        let ret = await handler.sendMailCompensation.get(data, ctx);
        return ask(ret);
    }

    async getMailData(data, ctx) {
        tools.BuzzUtil.checkFields(data, 'getMailData');
        let ret = await handler.getMailData.get(data, ctx);
        return ask(ret);
    }

    async delMail(data, ctx) {
        tools.BuzzUtil.checkFields(data, 'delMail');
        let ret = await handler.delMail.get(data, ctx);
        return ask(ret);
    }


}

module.exports = new GameMgmt();