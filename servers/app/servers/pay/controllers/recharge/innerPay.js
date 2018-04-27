const ERROR_OBJ = require('../../../../consts/fish_error').ERROR_OBJ;
const month_card = require('../data/month_card');

class InnerPay{
    constructor(){

    }

    async buy_card(data){
        data.itemId = data.itemid;
        return await month_card.buy(data);
    }

    async buy_comeback(data){
        throw ERROR_OBJ.NOT_SUPPORT_SERVICE;
    }

    async buy_gift(data){
        throw ERROR_OBJ.NOT_SUPPORT_SERVICE;
    }
}


module.exports = new InnerPay();