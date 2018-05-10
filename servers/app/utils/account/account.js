const utils = require('../utils');
const AccountCommit = require('./accountCommit');
const accountConf = require('./accountConf');
const REDISKEY = require('../../database/consts').REDISKEY;
const accountParser = require('./accountParser');
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
     * 序列化数据为Account对象
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

    /**
     * 添加属性到Account对象
     * @param key
     * @param data
     */
    appendValue(key, data) {
        this[`_${key}`] = accountParser.parseValue(key, data);
    }

    toJSON() {
        let jsonData = {};
        for (let key in this) {
            if (typeof this[key] !== 'function' && key.indexOf('__') !== 0) {
                jsonData[key.replace(/^_/, '')] = this[key];
            }
        }
        return jsonData;
    }

    static getCmd(key) {
        let typeInfo = accountConf.getFieldDef(key);
        let cmd = 'HSET';
        if (!typeInfo) {
            return null;
        }
        if (typeInfo.inc === true) {
            if (typeInfo.type == 'float') {
                cmd = 'HINCRBYFLOAT';
            } else {
                cmd = 'HINCRBY';
            }

        }
        return cmd;
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
                let v = accountParser.serializeValue(tk, key[1]);
                if (v) {
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