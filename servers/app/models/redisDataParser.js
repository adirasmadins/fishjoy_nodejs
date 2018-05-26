const modelsUtil = require('./modelsUtil');
const moment = require('moment');


class AccountParser {
    /**
     * 序列化对象为redis value
     * @param key
     * @param value
     * @returns {*}
     */
    serializeValue(key, value, isDefault = true) {
        let serialVal = null;
        let typeInfo = modelsUtil.getFieldDef(key);
        if (!typeInfo) {
            logger.error('非法字段，无法写入redis, 请检查字段名是否正确', key, value);
            return null;
        }

        if ((null === value || undefined === value || '' === value) && isDefault) {
            if (typeInfo.type === 'object') {
                value = Object.deepClone(typeInfo.def);
            } else {
                value = typeInfo.def;
            }
        }

        switch (typeInfo.type) {
            case 'float':
            case 'number': {
                if (!Number.isNaN(Number(value))) {
                    serialVal = value.toString();
                }
            }
                break;
            case 'string': {
                if (typeof value === 'string') {
                    serialVal = value;
                }
            }
                break;
            case 'timestamp': {
                if (typeof value === 'string' && Number.isNaN(Number(value))) {
                    serialVal = moment(value).format('YYYY-MM-DD HH:mm:ss');
                } else if (!Number.isNaN(Number(value))) {
                    serialVal = moment(Number(value)).format('YYYY-MM-DD HH:mm:ss');
                }
            }
                break;
            case 'object': {
                if (typeof value === 'object') {
                    serialVal = JSON.stringify(value);
                }
            }
                break;
            default:
                break;
        }

        if (null == serialVal && typeInfo.def != null) {
            logger.error('字段值非法，无法写入redis, 请检查数据来源是否正确', key, value);
        }

        return serialVal;
    }

    /**
     * 解析redis数据
     * @param key
     * @param val
     * @returns {null}
     */
    parseValue(key, value, isDefault = true) {
        let serialVal = null;
        let typeInfo = modelsUtil.getFieldDef(key);
        if (!typeInfo) {
            logger.error('非法字段，无法解析，请检查字段名是否正确', key, value);
            return null;
        }

        if ((null == value || 'undefined' == value || '' === value || 'null' === value) && isDefault) {
            if (typeInfo.type === 'object') {
                value = Object.deepClone(typeInfo.def);
            } else {
                value = typeInfo.def;
            }
        }

        switch (typeInfo.type) {
            case 'float':
            case 'number': {
                if (!isNaN(Number(value))) {
                    serialVal = Number(value);
                }
            }
                break;
            case 'string':
                serialVal = value;
                break;
            case 'timestamp':
                //TODO过渡方案
                if (value === '0000-00-00 00:00:00') {
                    value = '1970-01-02 00:00:00';
                } else if (typeof (value) === 'string' && value.indexOf('-') === -1) {
                    value = Number(value);
                }
                serialVal = moment(value).format('YYYY-MM-DD HH:mm:ss');
                break;
            case 'object': {
                try {
                    if (typeof value === 'string') {

                        if (typeInfo.def instanceof Array) {
                            value = this.specialDone(key, value);
                        }
                        if (value.indexOf('object') != -1) {
                            logger.error('读取REDIS数据存在异常, 修复object数据为默认值', key, value, typeInfo.def);
                            serialVal = Object.deepClone(typeInfo.def);
                        } else {
                            serialVal = JSON.parse(value);
                        }

                    } else {
                        serialVal = value;
                    }
                } catch (err) {

                    logger.error("读取REDIS数据存在异常,执行数据修正 before:", key, value);

                    if (typeInfo.def instanceof Array) {
                        value = `[${value}]`;
                    } else {
                        value = `{${value}}`;
                    }
                    logger.error("读取REDIS数据存在异常,执行数据修正 after:", key, value);
                    try {
                        serialVal = JSON.parse(value);
                    } catch (e) {
                        logger.error("读取REDIS数据存在异常,数据修正失败", key, value);
                    }
                }
            }
                break;
            default:
                break;
        }

        if (serialVal == null && typeInfo.def != null) {
            logger.error('读取REDIS数据值异常, 请检查数据来源是否正确', key, value);
        }
        return serialVal;
    }


    specialDone(key, value) {
        const reg1 = /\[],/;
        const reg2 = /\[null]/;
        const reg3 = /null/;
        const reg4 = /,\[]/;
        let arr = [];
        if (!isNaN(Number(value))) {
            Number(value) != 0 && arr.push(Number(value));
            // logger.error(`pecialDone before key:${key},value:${value}`);
            let stringify3 = JSON.stringify(arr);
            // logger.error(`pecialDone after key:${key},value:${stringify3}`);
            return stringify3;
        }
        if (reg1.test(value) || reg4.test(value)) {
            let split = value.split(',');
            for (let i = 0; i < split.length; i++) {
                let val = Number(split[i]);
                if (!isNaN(val)) {
                    val != 0 && arr.push(val);
                }
            }
            // logger.error(`specialDone before key:${key},value:${value}`);
            let stringify = JSON.stringify(arr);
            // logger.error(`specialDone after key:${key},value:${stringify}`);
            return stringify;
        } else if (reg2.test(value)) {
            logger.error(`specialDone before key:${key},value:${value}`);
            let stringify2 = JSON.stringify(arr);
            // logger.error(`specialDone after key:${key},value:${stringify2}`);
            return stringify2;
        } else if (reg3.test(value)) {
            logger.error(`未处理异常数据,key:${key},value:${value}`);
        }
        return value;
    }
}


module.exports = new AccountParser();