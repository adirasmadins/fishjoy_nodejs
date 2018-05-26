const modelsUtil = require('./modelsUtil');
const redisDataParser = require('./redisDataParser');

/**
 * 动态代码，自动生成
 */
class Commit {
    constructor(id) {
        this.__update = [];
        this.__id = id;
    }

    get update() {
        return this.__update;
    }

    static bIncr(key) {
        let typeInfo = modelsUtil.getFieldDef(key);
        if (typeInfo) {
            return typeInfo.inc;
        }
        return false;
    }

    /**
     * 字段最小值修正
     * @param {key} key
     * @param {值} value
     */
    _minRevise(key, value) {
        let typeInfo = modelsUtil.getFieldDef(key);
        if (typeInfo && typeInfo.type == 'number') {
            let _value = Number(value);
            if (Number.isNaN(_value)) {
                logger.error('玩家非法数值写入, 禁止写入');
                return null;
            }

            if (typeInfo.min != null) {
                let nowValue = this[`_${key}`];
                let newValue = nowValue + _value;
                if (newValue < typeInfo.min) {
                    return _value + Math.abs(newValue) + typeInfo.min;
                }
            }
            return _value;
        }
        return value;
    }

    _modify(key, value) {
        value = this._minRevise(key, value);
        if (null == value) {
            return;
        }
        if (Commit.bIncr(key)) {
            this[`_${key}`] += value;
        } else {
            this[`_${key}`] = value;
        }
        this.__update.push([key, value]);
    }

    _value(key) {
        return this[`_${key}`];
    }

    static getCmd(key) {
        let typeInfo = modelsUtil.getFieldDef(key);
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

    /**
     * 添加属性到模型对象
     * @param key
     * @param data
     */
    appendValue(key, data) {
        this[`_${key}`] = redisDataParser.parseValue(key, data);
    }

    /**
     * 模型对象转化为JSON对象
     * @return {{}}
     */
    toJSON() {
        let jsonData = {};
        for (let key in this) {
            if (typeof this[key] !== 'function' && key.indexOf('__') !== 0) {
                jsonData[key.replace(/^_/, '')] = this[key];
            }
        }
        return jsonData;
    }

}

module.exports = Commit;