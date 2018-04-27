/**
 * 好友系统
 * Created by zhenghang on 2017/9/9.
 */
const buzz_friends = require('../../src/buzz/buzz_friends');
const logicResponse = require('../../../common/logicResponse');

async function addFriend(data) {
    return new Promise(function (resolve, reject) {
        buzz_friends.addFriend(data, function (err, result) {
            if (err) {
                logger.error('添加好友 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
}

async function delFriend(data) {
    return new Promise(function (resolve, reject) {
        buzz_friends.delFriend(data, function (err, result) {
            if (err) {
                logger.error('删除好友 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
}

exports.addFriend = addFriend;
exports.delFriend = delFriend;