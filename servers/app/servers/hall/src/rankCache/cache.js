const schedule = require('node-schedule');

class Cache {
    constructor(conf) {
        this.conf = conf;
    }

    run() {
        let _time = this.conf.time.split(',');
        let cron_time = `${_time[0]} ${_time[1]} ${_time[2]} ${_time[3]} ${_time[4]} ${_time[5]}`;
        let self = this;
        schedule.scheduleJob(cron_time, function () {
            self._update();
        });
    }

    _update(){}

    /**
     * 获取排行榜
     */
    static getChart(platform, type, start, stop) {
        let ret = [];
        if (!Cache.all_charts || !Cache.all_charts[platform] ||!Cache.all_charts[platform][type]) {
            return ret;
        }
        let charts = Cache.all_charts[platform][type]['players'];
        if (charts) {
            var range = stop - start;
            if (range > 0) {
                range = Math.min(charts.length, range);
                var length = start + range;
                for (var i = start; i < length; i++) {
                    var chart = charts[i];
                    ret.push(chart);
                }
            }
        }
        return ret;
    }

    /**
     * 获取指定玩家的排名
     {
         id:?,
         nickname:?,
         my_rank:?
     }
     */
    static getRank(platform, type, uid) {
        let ret = {
            uid: uid,
            my_rank: 10001,
        };
        let ch = null;
        if(Cache.all_charts[platform][type] && Cache.all_charts[platform][type]['ranks']){
            ch = Cache.all_charts[platform][type]['ranks'];
        }
        if (ch && ch[uid]) {
            ret.my_rank = ch[uid];
        }
        return ret;
    }
}

Cache.all_charts = {'1': {}, '2': {}};

module.exports = Cache;