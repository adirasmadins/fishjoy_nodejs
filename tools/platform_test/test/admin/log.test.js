const log = require('./log');
const expect = require("chai").expect;
const TEST_CASES = require('./log.cases');

describe('test goddessLog', () => {

    const CASES = TEST_CASES.GODDESS_LOG;

    function commonTest(logList) {
        expect(logList).to.have.property('rows');
        expect(logList).to.have.property('pages');
        expect(logList).to.have.property('chart');
        // console.error('rows:', logList.rows);
        // console.error('pages:', logList.pages);
        // console.error(logList.chart.length);
    }

    for (let i in CASES) {
        const TEST_CASE = CASES[i];
        it(TEST_CASE.desc, async () => {
            let logList = await log.goddessLog(TEST_CASE.params);
            commonTest(logList);
        });
    }
})