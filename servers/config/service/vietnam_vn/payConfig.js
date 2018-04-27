module.exports = {
        servers: [{
            id: 0,
            url: 'http://210.211.125.65:1586/VPGService.asmx?wsdl', //VN版本
            partner_code: 'h5vn',
            partner_key: '1bf190a3ffccf3ece697de49fe5c43ec',
            use_service_code: 'cardtelco',
            percent: 100,
            recharge: 0,
            can_use_card: true,
            can_buy_crad: false
        }],
        command: {
            useCard: 'usecard',
            buyCard: 'buycard'
        },
        payBalance: 10000,
};