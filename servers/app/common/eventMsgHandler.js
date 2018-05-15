const EventEmitter = require('events').EventEmitter;

class EventMsgHandler extends EventEmitter{
    constructor(){
        super();
        logger.error('-----------------EventMsgHandler');
    }

    postMsg(type, body){
    }

    subMsg(type){
        redisConnector.subCmd.subscribe(type, this.onRead.bind(this));
    }

    onRead(type, msg){
        this.emit(type, msg);
    }
}

module.exports = new EventMsgHandler();