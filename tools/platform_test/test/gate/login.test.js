const login = require('./login');
const CFG_ACCOUNT = require('../../configs/account');
const GAME_CONSTS = require('../../configs/gameConsts');
const ERROR_CODE = GAME_CONSTS.fish_error.ERROR_CODE;
const expect = require("chai").expect;

describe('test login', () => {
    it('login success', async () => {
        let account = await login.login(CFG_ACCOUNT.UNAME, CFG_ACCOUNT.PWD);
        let token = account.token;
        let uid = token.split('_')[0];
        expect(token).to.be.a('string');
        expect(uid).equal(CFG_ACCOUNT.UID);
    });

    it('login fail with wrong password', async () => {
        try {
            let account = await login.login(CFG_ACCOUNT.UNAME, CFG_ACCOUNT.PWD + 0);
            expect(account).equal(null);
        }
        catch (err) {
            expect(err).to.be.a('object');
            expect(err.code).equal(ERROR_CODE.USERNAME_PASSWORD_ERROR);
        }
    });

    it('login fail with wrong username', async () => {
        try {
            let account = await login.login(CFG_ACCOUNT.UNAME_WRONG, CFG_ACCOUNT.PWD);
            expect(account).equal(null);
        }
        catch (err) {
            expect(err).to.be.a('object');
            expect(err.code).equal(ERROR_CODE.USER_NOT_EXIST);
        }
    });
})