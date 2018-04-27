const chat = require('../controllers/chat');
const data_feedback = require('../controllers/feedback');

module.exports = [{
    route: '/get_chat_info', //聊天信息获取
    handler: chat.getChat,
    params: [],
    accountFields: null
}, {
    route: '/player_propose', //接收玩家发来的一条留言.
    handler: data_feedback.playerPropose,
    params: [],
    accountFields: null
}, {
    route: '/query_msgboard', //客户端拉取留言板内容
    handler: data_feedback.queryMsgboard,
    params: [],
    accountFields: null
}, {
    route: '/like_msgboard', //玩家点赞
    handler: data_feedback.likeMsgboard,
    params: [],
    accountFields: null
}, {
    route: '/del_msgboard', //刪除留言
    handler: data_feedback.delMsgboard,
    params: [],
    accountFields: null
}, {
    route: '/send_chat', //发送聊天
    handler: chat.sendChat,
    params: [],
    accountFields: []
}
];