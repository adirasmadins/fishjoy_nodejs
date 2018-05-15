const expect = require("chai").expect;
const month_sign = require('./month_sign');

describe('month_sign test', () => {
    it('check month_sign data formate', () => {
        // equal or no equal
        expect(month_sign.add(100, 100)).equal(9);
        expect(month_sign.add(100, 100)).not.equal(9);

        //boolean
        expect('ok').to.be.ok;
        expect(false).to.not.be.ok;
    });
});