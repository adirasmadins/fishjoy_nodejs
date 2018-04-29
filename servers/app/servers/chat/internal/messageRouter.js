const Broadcast = require('./getBroadcast');
const FriendRequest = require('./friendRequest');
const PrivateMessage = require('./privateMessage');
const WorldMessage = require('./worldMessage');
const constDef = require('../../../consts/constDef');

class MessageRouter {
    constructor() {
        this._module = {};
        this.init();
    }

    async send(data) {
        const module = this._module[data.channel];
        return await module.send(data);
    }

    getCurrentMsg(data) {
        const world_msg=this._module[constDef.MSG_TYPE.WORLD_MSG].getCurrentMsg(data);
        const private_msg=this._module[constDef.MSG_TYPE.PRIVATE_MSG].getCurrentMsg(data);
        const friend_request=this._module[constDef.MSG_TYPE.FRIEND_REQUEST].getCurrentMsg(data);
        const broadcast=this._module[constDef.MSG_TYPE.BROADCAST].getCurrentMsg(data);
        let ret = {};
        world_msg && (ret[constDef.MSG_TYPE.WORLD_MSG] = world_msg);
        private_msg && (ret[constDef.MSG_TYPE.PRIVATE_MSG] = private_msg);
        friend_request && (ret[constDef.MSG_TYPE.FRIEND_REQUEST] = friend_request);
        broadcast && (ret[constDef.MSG_TYPE.BROADCAST] = broadcast);
        return ret;
    }

    init(){
        this._module[constDef.MSG_TYPE.WORLD_MSG] = WorldMessage;
        this._module[constDef.MSG_TYPE.PRIVATE_MSG] = PrivateMessage;
        this._module[constDef.MSG_TYPE.FRIEND_REQUEST] = FriendRequest;
        this._module[constDef.MSG_TYPE.BROADCAST] = Broadcast;
    }

}

module.exports = new MessageRouter();