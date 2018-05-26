class Countdown {
    constructor(notify, duration, interval = 1000) {
        this._duration = duration;
        this._interval = interval;
        this._lastUpdateTime = Date.now();
        this._notify = notify;
    }

    get duration(){
        return this._duration;
    }

    isZero(){
        return this._duration == 0;
    }

    reset(duration, interval = 1000){
        this._duration = duration;
        this._interval = interval;
    }

    _flushCountdown() {
        let subTime = Date.now() - this._lastUpdateTime;
        return subTime;
    }

    _notify_free_time() {
        this._notify && this._notify(this._duration);
        this._lastUpdateTime = Date.now();
    }

    tick() {
        //更新倒计时        
        let subTime = this._flushCountdown();
        if (subTime >= this._interval) {
            this._duration -= this._interval;
            this._duration = Math.max(this._duration, 0);
            this._notify_free_time();
        }
    }
}

module.exports = Countdown;

