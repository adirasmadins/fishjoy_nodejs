const soap = require('soap');
const crypto = require('crypto');
const BuyCardProtocol = require('./buyCardProtocol');
const UseCardProtocol = require('./useCardProtocol');
const ERROR_OBJ = require('../../../../../../consts/fish_error').ERROR_OBJ;

const VIETNAMERROR_STRING = {
    '1': 'Giao dịch thành công',
    '-300': 'Dịch vụ đang bảo trì',
    '-330': 'Thẻ đã sử dụng',
    '-331': 'Thẻ đã bị khóa',
    '-332': 'Thẻ quá thời gian sử dụng',
    '-333': 'Thẻ chưa được kích hoạt',
    '-334': 'Số serial hoặc mã thẻ không hợp lệ',
    '-335': 'Số mã thẻ hoặc serial không hợp lệ',
    '-49': 'Bạn đã nạp sai mã thẻ quá 5 lần. Chức năng nạp thẻ của bạn sẽ bị tạm dừng trong vòng 24 giờ',
    '-336': 'Thông tin loại thẻ không đúng',
    '-323': 'Tham số truyền vào không đúng',
    '-337': 'Sai định dạng thẻ',
    '-327': 'Không tìm thấy nhà cung cấp phù hợp',
};

class VietnamApi {
    constructor(config) {
        this._config = config;
        this._rechargeServers = config.servers.filter(function (server) {
            return server.percent != 0;
        });
        this._cashServers = config.servers.filter(function (server) {
            return server.can_buy_crad != true;
        });

    }

    _md5(input) {
        let md5sum = crypto.createHash('md5');
        md5sum.update(input);
        return md5sum.digest('hex');
    }

    _buildReq(data, serviceCode, partner_code, partner_key, pay_command_code) {
        let originalData = partner_code + serviceCode + pay_command_code + data.toString() + partner_key;
        let signature = this._md5(originalData);
        let req_ata = {
            partnerCode: partner_code,
            serviceCode: serviceCode,
            commandCode: pay_command_code,
            requestContent: data.toString(),
            signature: signature
        };
        return req_ata;
    }

    async _useCardHandler(useCard) {

        let last_err = null;
        this._rechargeServers.sort(function () {
            return Math.random() > 0.5 ? -1 : 1;
        });
        for (let i = 0; i < this._rechargeServers.length; ++i) {
            let server = this._rechargeServers[i];
            if (!server.can_use_card) {
                continue;
            }
            logger.info('---server', server);

            if (server.recharge >= server.percent / 100 * this._config.payBalance) {
                continue;
            }

            let req = this._buildReq(useCard, server.use_service_code, server.partner_code, server.partner_key, this._config.command.useCard);
            try {
                let amount = Number(await this.request(server.url, req));
                server.recharge += amount;
                return amount;
            } catch (err) {
                last_err = err;
            }
        }

        if (!last_err) {
            logger.info('充值池充值完成');
            this._rechargeServers.map(function (item) {
                item.recharge = 0;
                return item;
            });
            logger.info('充值池充值完成', [...this._rechargeServers]);
            return await this._useCardHandler(useCard);
        }

        throw last_err;
    }

    async _buyCardHandler(buyCard) {
        let last_err = null;
        this._cashServers.sort(function () {
            return Math.random() > 0.5 ? -1 : 1;
        });

        for (let i = 0; i < this._cashServers.length; ++i) {
            let server = this._cashServers[i];
            if (!server.can_buy_crad) {
                continue;
            }
            let req = this._buildReq(buyCard, server.buy_service_code, server.partner_code, server.partner_key, this._config.command.buyCard);
            try {
                let cardInfo = await this.request(server.url, req);
                return cardInfo;
            } catch (err) {
                last_err = err;
            }
        }

        throw last_err;
    }

    async useCard(cardCode, cardSerial, cardType, accountName, refCode) {
        let useCard = new UseCardProtocol(cardCode, cardSerial, cardType, accountName, 'fishjoy', refCode);
        return await this._useCardHandler(useCard);
    }

    async buyCard(cardType, amount, quantity, accountName, orderNo) {
        let buyCard = new BuyCardProtocol(cardType, amount, quantity, accountName, orderNo);
        return await this._buyCardHandler(buyCard);
    }

    //{ RequestResult: '{"ResponseCode":-310,"Description":"Access denied","ResponseContent":"","Signature":"33cd7be5c72731b43f355ae522f5b444"}' }
    request(url, req) {
        let self = this;
        return new Promise(function (resolve, reject) {
            soap.createClient(url, function (err, client) {
                if (err) {
                    logger.error('soap.createClient err', err);
                    reject(ERROR_OBJ.NETWORK_ERROR);
                    return;
                }
                client.Request(req, function (err, resp) {
                    if (err) {
                        logger.error('soap.client.Request', err);
                        reject(err);
                        return;
                    }
                    logger.info('-----------pay response:', resp);
                    try {
                        let ret_obj = JSON.parse(resp.RequestResult);
                        if (1 == ret_obj.ResponseCode) {
                            resolve(ret_obj.ResponseContent);
                        } else {
                            reject({
                                code: ret_obj.ResponseCode,
                                msg: self._getErrorString(ret_obj.ResponseCode) || ret_obj.Description
                            });
                        }
                    } catch (err) {
                        logger.error('支付返回数据异常:', err);
                        reject(ERROR_OBJ.DATA_INVALID);
                    }
                });
            });

        });
    }

    _getErrorString(code) {
        if (VIETNAMERROR_STRING[code]) {
            return VIETNAMERROR_STRING[code];
        }
    }
}

module.exports = VietnamApi;