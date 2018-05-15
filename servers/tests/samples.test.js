//mocha samples.test.js -t 5000 -reporter spec
//mocha samples.test.js -t 5000 --reporter mochawesome
//mocha ./test*/*.test.js -t 5000 --reporter mochawesome

// mocha test.js --reporter mochawesome --reporter-options reportDir=customReportDir,reportName=customReportName

const expect = require("chai").expect;
const samples = require('./samples');
const request = require('supertest');

describe('mocha sampele1', () => {
    it('equal or not equal', () => {
        expect(samples.add(2,1)).equal(3);
        expect(samples.add(3,5)).not.equal(8);
    });

    it('boolean', () => {
        expect(samples.compareValue(2,1)).to.be.ok;
        expect(samples.compareValue(1,8)).to.not.be.ok;
    });

    it('type', () => {
        expect(samples.getObj('zhangsan',1)).to.be.a('string');
        expect(samples.getObj('lisi',100)).to.be.an('object');
    });

});


describe('mocha sampele2', () => {
    it('read book async timeout mocha --timeout', (done) => {
        samples.read((err, result)=>{
            expect(err).equal(null);
            expect(result).to.be.a('string');
            done();
        });
    });
});

describe('http test samples3', ()=>{
    it('get baidu info', (done)=>{
        request('https://www.baidu.com')
        .get('/')
        .expect(200)
        .expect('Content-Type', /html/)
        .end((err, res)=>{
            // console.log(res.text);
            expect(res).to.be.an('object');
            done();
        });
    });
});