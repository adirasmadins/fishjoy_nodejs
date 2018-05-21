const omelo = require('omelo');
const globalStatusData = require('../../../utils/globalStatusData');
const rpcDefs = require('../../../net/rpcDefs');

class Room{
    constructor(opts){
        this._roomId = opts.roomId;
        this._roomType = opts.roomType;
        this._sceneId = opts.sceneId;
        this._gamePosType = opts.gamePosType || null;

        if(opts.roomId){
            this._roomMsgChannel = omelo.app.get('channelService').getChannel(opts.roomId, true);
        }
        this._worldMsgChannel = omelo.app.get('globalChannelService');
    }

    start(){
    }

    stop(){
        if (this._roomMsgChannel) {
            this._roomMsgChannel.destroy();
            this._roomMsgChannel = null;
        }
    }

    //获取房间模式
    get mode() {
        return this._roomType;
    }

    get sceneId() {
        return this._sceneId;
    }

    get roomId() {
        return this._roomId;
    }

    addMsgChannel(uid, sid){
        this._roomMsgChannel.add(uid, sid);
    }

    leaveMsgChannel(uid, sid){
        this._roomMsgChannel.leave(uid, sid);
    }

    addWorldChannel(uid, sid, channelName){
        this._worldMsgChannel.add(channelName, uid, sid);
    }

    leaveWorldChannel(uid, sid, channelName){
        this._worldMsgChannel.leave(channelName, uid, sid);
    }

    addGamePos(uid, sid, data){
        if(this._gamePosType){
            globalStatusData.addData(this._gamePosType, uid, sid, data);
        }
    }

    delGamePos(uid, sid){
        if(this._gamePosType){
            globalStatusData.delData(this._gamePosType, uid, sid);
        }
    }

    roomBroadcast(route, data) {
        if(this._roomMsgChannel){
            this._roomMsgChannel.pushMessage(route, data);
        }

    }

    worldBroadcast(route, data, channelName, serverType = rpcDefs.serverType.game){
        if(this._worldMsgChannel){
            this._worldMsgChannel.pushMessage(serverType, route, data, channelName);
        }
    }
}

module.exports = Room;