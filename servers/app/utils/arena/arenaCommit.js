const Commit = require('../../models/commit');

class ArenaCommit extends Commit{
    constructor(id){
        super(id);
    }

    get id() {
        return this.__id;
    }

    set arena_created_at(value) {
        this._modify('arena_created_at', value);
    }

    get arena_created_at() {
        return this._value('arena_created_at');
    }

    set arena_inviter(value) {
        this._modify('arena_inviter', value);
    }

    get arena_inviter() {
        return this._value('arena_inviter');
    }

    set arena_invitee(value) {
        this._modify('arena_invitee', value);
    }

    get arena_invitee() {
        return this._value('arena_invitee');
    }

    set arena_state(value) {
        this._modify('arena_state', value);
    }

    get arena_state() {
        return this._value('arena_state');
    }
}

module.exports = ArenaCommit;