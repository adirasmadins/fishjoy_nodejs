const EventEmitter = require('events').EventEmitter;
const redisClient = require('../utils/dbclients').redisClient;

class EventMsgHandler extends EventEmitter{
    constructor(){
        super();
    }

    postMsg(type, body){
    }

    subMsg(type){
        redisClient.subCmd.subscribe(type, this.onRead.bind(this));
    }

    onRead(type, msg){
        this.emit(type, msg);
    }
}

module.exports = new EventMsgHandler();