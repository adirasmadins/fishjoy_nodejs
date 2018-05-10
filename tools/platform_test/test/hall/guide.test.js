const guide = require('./guide');
const testUtil = require('../../utils/TestUtil');
const CFG_ACCOUNT = require('../../configs/account');
const GAME_CONSTS = require('../../configs/gameConsts');
const ERROR_CODE = GAME_CONSTS.fish_error.ERROR_CODE;
const REDISKEY = require('../../../../servers/app/database/consts').REDISKEY;
const expect = require("chai").expect;

describe('test guide_reward', () => {
    it('guide_reward success', async () => {
        await testUtil.runRedisScript([
            ['HSET', REDISKEY.GUIDE, CFG_ACCOUNT.UID, 0]
        ]);
        let ret = await guide.guideReward();
        expect(ret).to.have.property('item_list');
        expect(ret).to.have.property('change');
        // console.log(JSON.stringify(ret.change.package));
    });

    it('guide_reward fail', async () => {
        try {
            await testUtil.runRedisScript([
                ['HSET', REDISKEY.GUIDE, CFG_ACCOUNT.UID, 1]
            ]);
            let ret = await guide.guideReward();
            expect(ret).equal(null);
        }
        catch (err) {
            expect(err).to.be.a('object');
            expect(err.code).equal(ERROR_CODE.GUIDE_REWARD_ALREADY);
        }
    });
})