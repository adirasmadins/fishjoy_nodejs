class UseCardProtocol {
    constructor(cardCode, cardSerial, cardType, accountName, appCode, refCode) {
        this._cardCode = cardCode || '';
        this._cardSerial = cardSerial || '';
        this._cardType = cardType || '';
        this._accountName = accountName || ''; //合作方在系统的账号名字
        this._appCode = appCode || '';
        this._refCode = refCode || '';
    }

    get refCode() {
        return this._refCode;
    }

    toString() {
        let json = {
            cardSerial: this._cardSerial,
            cardCode: this._cardCode,
            cardType: this._cardType,
            accountName: this._accountName,
            refCode: this._refCode,
            appCode: this._appCode
        };
        return JSON.stringify(json);
    }
}

module.exports = UseCardProtocol;