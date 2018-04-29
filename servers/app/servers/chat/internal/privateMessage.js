const CstError = require('../../../consts/fish_error'),
    ERROR_OBJ = CstError.ERROR_OBJ;
const REDISKEY = require('../../../database').dbConsts.REDISKEY;
const moment = require('moment');
const constDef = require('../../../consts/constDef');

class PrivateMessage {

    start() {
        let self = this;
        redisConnector.sub(this.getPubKey(), function (data) {
            self.saveMsg(data);
        });
    }

    async send(data) {
        const msg = data.msg;
        this.checkMsg(msg);
        await this.publishMsg(msg);
    }

    async getCurrentMsg(data) {
        let now = moment();
        let mid = data.mid || now.format('YYYYMMDD') + "-" + 0;
        let count = data.count || 10;
        let account = data.account;
        let split = mid.split('-');
        let date = +split[0];
        let date_id = +split[1];
        if (isNaN(date) || isNaN(date_id) || !moment(date).isValid() || moment(date).isAfter(now)) {
            throw ERROR_OBJ.PARAM_WRONG_TYPE;
        }
        if (moment().diff(now, 'days') > PrivateMessage.DAYS) {
            date = moment().subtract(PrivateMessage.DAYS, 'days');
        }
        let redisMsg =await this.getRedisMsg(account.id, date, date_id, count);
        while (redisMsg.length < count){
            date = moment().add(1, 'days');
            if (now.isAfter(date)) {
                break;
            }
            let tempMsg =await this.getRedisMsg(account.id, date, 0, count);
            redisMsg.concat(tempMsg);
        }
        if (redisMsg.length === 0) return null;
        redisMsg.reverse();
        return redisMsg;

    }

    checkMsg(msg) {
        for (let i in PrivateMessage.MSG_DESCRIPTION) {
            if (!msg[PrivateMessage.MSG_DESCRIPTION[i]]) {
                throw ERROR_OBJ.PARAM_MISSING;
            }
        }
    }

    async publishMsg(msg) {
        redisConnector.pub(this.getPubKey(), msg);
    }

    generateMsgId(id) {
        return new Promise((resolve, reject) => {
            let incrKey = this.getIncrKey(id);
            redisConnector.cmd.incr(incrKey, function (err, res) {
                if (err) {
                    reject(ERROR_OBJ.DB_ERR);
                } else {
                    redisConnector.expire(incrKey, PrivateMessage.EXPIRE_TIME);
                    resolve(res);
                }
            });
        });
    }

    getPubKey() {
        return `${REDISKEY.CH.PRIVATE_CHAT}`;
    }

    getIncrKey(id) {
        const time = this.formatDate();
        return `${time}-pm-${id}`;
    }

    getRedisMsgKey(id, date) {
        return `${REDISKEY.MSG.PRIVATE_MSG}_${id}_${date}`;
    }

    async saveMsg(msg) {
        let recver = msg.recver;
        let sender = msg.sender;
        let recver_mid = await this.generateMsgId(recver);
        msg.mid = `${this.formatDate()}-${recver_mid}`;
        redisConnector.cmd.zadd(this.getRedisMsgKey(recver, this.formatDate()), recver_mid, JSON.stringify(msg));
        let sender_mid = await this.generateMsgId(sender);
        msg.mid = `${this.formatDate()}-${sender_mid}`;
        redisConnector.cmd.zadd(this.getRedisMsgKey(sender, this.formatDate()), sender_mid, JSON.stringify(msg));
    }

    formatDate() {
        return moment().format('YYYYMMDD');
    }

    getRedisMsg(id, date, mid, count) {
        let self = this;
        return new Promise((resolve, reject) => {
            redisConnector.cmd.zrangebyscore(self.getRedisMsgKey(id, date), mid, mid + count, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
        });
    }
}

PrivateMessage.MSG_DESCRIPTION = ['recver', 'sender'];
PrivateMessage.EXPIRE_TIME = 3600 * 24 * 5;//计数过期时间
PrivateMessage.DAYS = 2;

module.exports = new PrivateMessage();