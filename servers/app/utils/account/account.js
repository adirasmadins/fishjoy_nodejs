const utils = require('../utils');
const AccountCommit = require('./accountCommit');
const REDISKEY = require('../../models/index').REDISKEY;
const redisDataParser = require('../../models/redisDataParser');
const EventHandler = require('./eventHandler');
const ACCOUNT_EVENT_TYPE = require('../../database/consts/consts').ACCOUNT_EVENT_TYPE;
const omelo = require('omelo');
const versions = require('../../../config/versions');

class Account extends AccountCommit {
    constructor(id) {
        super(id);
        this.__eventHandler = new EventHandler();
    }

    /**
     * 序列化数据为Account模型对象
     * @param uid
     * @param data
     * @returns {Account}
     */
    static parse(uid, data) {
        let account = new Account(uid);
        for (let key in data) {
            account.appendValue(key, data[key]);
        }
        return account;
    }

    commitSync(){
        return new Promise(function (resolve, reject) {
            this.commit(function (err, result) {
                if(err){
                    reject(err);
                }else {
                    resolve(result);
                }
            });
        }.bind(this));
    }

    commit(cb) {

        let fields = this.__update;

        if (fields.length === 0) {
            utils.invokeCallback(cb, null);
            return;
        }

        let serverType = omelo.app.getServerType();
        if (serverType != 'game') {
            versions.PUB == versions.GAMEPLAY.LOCAL && logger.error('account commit:', fields);
        }

        let cmds = [];
        let fields_keys = [];

        this.__eventHandler.listenKey(fields, this);

        fields.forEach(function (key) {
            let tk = key[0];
            let cmd = Account.getCmd(tk);
            if (cmd) {
                let v = redisDataParser.serializeValue(tk, key[1]);
                if (v != null) {
                    cmds.push([cmd, REDISKEY.getKey(tk), this.id, v]);
                    fields_keys.push(tk);
                }
            }
        }.bind(this));
        this.__update = [];

        redisConnector.cmd.multi(cmds).exec(async function (err, result) {
            if (err) {
                utils.invokeCallback(cb, err);
                return;
            }

            this.__eventHandler.addEvent(ACCOUNT_EVENT_TYPE.DATA_SYNC, this, fields_keys);

            await this.__eventHandler.exec();

            utils.invokeCallback(cb, null, result);
        }.bind(this));
    }
}

module.exports = Account;