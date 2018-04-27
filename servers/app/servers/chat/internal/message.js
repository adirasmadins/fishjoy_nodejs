const Broadcast = require('./broadcast');
const FriendRequest = require('./friendRequest');
const PrivateMessage = require('./privateMessage');
const WorldMessage = require('./worldMessage');

class Message {
    constructor() {
        this._module = {};
        this.init();
    }

    send(data) {
        const module = this._module[data.channel];
        module.send(data);
    }

    getCurrentMsg(data) {
        const world_msg=this._module[Message.MsgType.WORLD_MSG].getCurrentMsg(data);
        const private_msg=this._module[Message.MsgType.PRIVATE_MSG].getCurrentMsg(data);
        const friend_request=this._module[Message.MsgType.FRIEND_REQUEST].getCurrentMsg(data);
        const broadcast=this._module[Message.MsgType.BROADCAST].getCurrentMsg(data);
        let ret = {};
        world_msg && (ret[Message.MsgType.WORLD_MSG] = world_msg);
        private_msg && (ret[Message.MsgType.PRIVATE_MSG] = private_msg);
        friend_request && (ret[Message.MsgType.FRIEND_REQUEST] = friend_request);
        broadcast && (ret[Message.MsgType.BROADCAST] = broadcast);
        return ret;
    }

    init(){
        this._module[Message.MsgType.WORLD_MSG] = new WorldMessage();
        this._module[Message.MsgType.PRIVATE_MSG] = new PrivateMessage();
        this._module[Message.MsgType.FRIEND_REQUEST] = new FriendRequest();
        this._module[Message.MsgType.BROADCAST] = new Broadcast();
    }

}

Message.MsgType = {
    WORLD_MSG: 1,
    PRIVATE_MSG:0,
    FRIEND_REQUEST:2,
    BROADCAST:3,
    OTHER:4
};

module.exports = new Message();