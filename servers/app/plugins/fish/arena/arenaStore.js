class ArenaStore{
    constructor(opts){
        this._challenger = opts.challenger;
        this._createTimestamp = opts.createTimestamp || Date.now();
        this._pkId = opts.pkId;
        this._state = opts.state || 0;
    }

    write(){

    }

    read(){

    }
}

module.exports = ArenaStore;

