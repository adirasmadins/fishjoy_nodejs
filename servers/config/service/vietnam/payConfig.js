module.exports = {
    servers: [{
        id: 0,
        url: 'http://210.211.125.65:1586/VPGService.asmx?wsdl', //VN版本
        partner_code: 'mrh5',
        partner_key: 'e12bad3bf55e7ed96bcfdbd1796f91cf',
        use_service_code: 'cardtelco',
        percent: 100,
        recharge: 0,
        can_use_card: true,
        can_buy_crad: false
    }, {
        id: 1,
        url: 'http://35.187.251.197:1581/VPGService.asmx?wsdl',
        partner_code: 'mrh',
        partner_key: '92f8278b47c1294e0c28e9dd87ead0f6',
        use_service_code: 'cardtelco',
        buy_service_code: 'buycard',
        percent: 0,
        recharge: 0,
        can_use_card: true,
        can_buy_crad: true
    }],
    command: {
        useCard: 'usecard',
        buyCard: 'buycard'
    },
    payBalance: 10000, //
};