class BuyCardProtocol {
    constructor(cardType, amount, quantity, accountName, orderNo) {
        this._provider = cardType || ''; //供应商
        this._amount = amount || ''; //卡价值
        this._quantity = quantity || ''; //数量
        this._accountName = accountName || ''; //合作方在系统的账号名字
        this._orderNo = orderNo || ''; //参考码（对方的订单码-小于50记号，不重复的字串）
    }

    toString() {
        let json = {
            Provider: this._provider,
            Amount: this._amount,
            Quantity: this._quantity,
            AccountName: this._accountName,
            OrderNo: this._orderNo
        };
        return JSON.stringify(json);
    }
}

module.exports = BuyCardProtocol;