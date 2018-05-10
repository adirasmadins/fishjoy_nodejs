const cik = require('./cik');
const CFG_ACCOUNT = require('../../configs/account');
const GAME_CONSTS = require('../../configs/gameConsts');
const ERROR_CODE = GAME_CONSTS.fish_error.ERROR_CODE;
const expect = require("chai").expect;

describe('test query_cik', () => {
    it('query_cik success', async () => {
        let cikInfo = await cik.queryCik();
        // console.error('cikInfo:', cikInfo);
        expect(cikInfo).to.be.a('array');
        expect(cikInfo.length <= 100).to.equal(true);
        for (let i in cikInfo) {
            expect(cikInfo[i]).to.have.property('uid');
            expect(cikInfo[i]).to.have.property('itemname');
            expect(cikInfo[i]).to.have.property('count');
            expect(cikInfo[i]).to.have.property('nickname');
        }
    });
})

describe('test get_huafeiquan', () => {
    it('get_huafeiquan success', async () => {
        let huafeiquan = await cik.getHuafeiquan();
        expect(huafeiquan).to.have.property('change');
        let change = huafeiquan.change;
        expect(change).to.have.property('package');
        let package = change.package;
        expect(package).to.have.property('9');
        let type = package[9];
        expect(type).to.have.property('i003');
    });
})