const auth = require('./auth');
const CFG_ACCOUNT = require('../../configs/account');
const GAME_CONSTS = require('../../configs/gameConsts');
const ERROR_CODE = GAME_CONSTS.fish_error.ERROR_CODE;
const expect = require("chai").expect;

describe('test admin login', () => {
    it('admin login success', async () => {
        let session = await auth.login(CFG_ACCOUNT.ADMIN_NAME, CFG_ACCOUNT.ADMIN_PWD);
        expect(session).to.be.a('string');
        expect(session).to.have.lengthOf(48);
    });

    it('admin login fail', async () => {
        try {
            let session = await auth.login(CFG_ACCOUNT.ADMIN_NAME, CFG_ACCOUNT.ADMIN_PWD + 0);
        } catch (err) {
            expect(err).to.not.equal(null);
        }
    });
})