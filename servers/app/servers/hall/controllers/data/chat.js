/**
 * 聊天
 * Created by zhenghang on 2017/9/15.
 */
const buzz_chat = require('../../src/buzz/buzz_chat');
const logicResponse = require('../../../common/logicResponse');

async function sendChat(data) {
    return new Promise(function(resolve, reject){
        buzz_chat.sendChat(data, function (err, result) {
            if(err){
                logger.error('发送消息 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
}

async function userInfo(data) {
    return new Promise(function(resolve, reject){
        buzz_chat.userInfo(data, function (err, result) {
            if(err){
                logger.error('用户信息 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
}

async function forbid_player_world(data) {
    return new Promise(function(resolve, reject){
        buzz_chat.forbid_player_world(data, function (err, result) {
            if(err){
                logger.error('禁言 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
}

async function unforbid_player_world(data) {
    return new Promise(function(resolve, reject){
        buzz_chat.unforbid_player_world(data, function (err, result) {
            if(err){
                logger.error('解除禁言 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
}

exports.sendChat = sendChat;
exports.userInfo = userInfo;
exports.forbid_player_world = forbid_player_world;
exports.unforbid_player_world = unforbid_player_world;