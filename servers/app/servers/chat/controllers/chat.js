const buzz_chat = require('../src/buzz/buzz_chat');
const logicResponse = require('../../common/logicResponse');

async function getChat(data) {
    //TODO linyng
    return logicResponse.ask({});
    return new Promise(function(resolve, reject){
        buzz_chat.getChat(data, function (err, result) {
            if(err){
                logger.error('获取聊天 err:', err);
                reject(err);
                return;
            }
            resolve(logicResponse.ask(result));
        });
    });
}

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

module.exports = {
    getChat,
    sendChat,
};