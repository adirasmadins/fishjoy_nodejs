const dao_shop = require('../../src/dao/dao_shop');
const VietnamPay = require('./vietnamPay');
const WanbaPay = require('./wanbaPay');
const iosPay = require('./iosPay');
const Pay = require('./Pay');
const googlePay = require('./googlePay');

class mockPay extends Pay {
    async buyByRMB(data) {
        return await this.buySuccess(data, data.itemid, data.orderid, data.itemtype);
    }
}


class VietnamMockPay extends VietnamPay{
    async callSdk(data){
        return 30000;
    }
}

class LocalPay extends VietnamMockPay {

}



module.exports = mockPay;