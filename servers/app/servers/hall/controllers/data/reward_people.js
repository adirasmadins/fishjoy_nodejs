/**
 * 打赏
 * Created by zhenghang on 2017/9/7.
 */
const buzz_reward_people = require('../../src/buzz/buzz_reward_people');
const logicResponse = require('../../../common/logicResponse');

async function reward_people(data) {
    return new Promise(function (resolve, reject) {
        buzz_reward_people.give_reward(data, function (err, result) {
            if (err) {
                logger.error('打赏 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
}

exports.reward_people = reward_people;