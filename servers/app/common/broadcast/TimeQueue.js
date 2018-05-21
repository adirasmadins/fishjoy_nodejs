// 时间序列类
class TimeQueue {
    /**
     * @param {*} timeInterval 检测时间间隔, 单位是毫秒.
     * @param {*} timeOffset 超过此时间间隔长度的对象将被移除出队列.
     * @param {*} recentRetLength 返回给客户端的公告内容条数.
     * @param {*} maxQueueLength 队列的最大长度.
     */
    constructor(timeInterval, timeOffset, recentRetLength, maxQueueLength) {
        this.queue = [];
        this.timeInterval = timeInterval;
        this.recentRetLength = recentRetLength;
        this.maxQueueLength = maxQueueLength;

        var crossQueue = this.queue;
        setInterval(function () {
           // logger.info('检测时间队列');
            var currentTimesamp = Date.parse(new Date());
            for (var i = 0; i < crossQueue.length; i++) {
                var broadcast = crossQueue[i];
                if (broadcast) {
                    if (currentTimesamp - timeOffset > broadcast.timestamp) {
                        crossQueue.shift();
                    }
                    else {
                        break;
                    }
                }
            }
        }, this.timeInterval);
    }

    push(broadcast) {
        if (this.queue.length >= this.maxQueueLength) {
            this.queue.shift();
        }
        this.queue.push(broadcast);
    }

    getRecent(timestamp) {
        var start = this.queue.length - Math.min(this.recentRetLength, this.queue.length);
        var ret = [];
        for (var i = start; i < this.queue.length; i++) {
            var oneBroadcast = this.queue[i];
            if (!timestamp || timestamp < oneBroadcast.timestamp) {
                ret.push(this.queue[i]);
            }
        }
        return ret;
    }
}

module.exports = TimeQueue;