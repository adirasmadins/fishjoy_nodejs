const logTableDef = require('./logTableDef');
const utils = require('../utils');

/**
 * log写入mysql
 */
class MysqlLogInsert {

    constructor() {
        this.sqlTemplate = {};
        this._init();
    }


    /**
     * 批量刷入日志
     * @param sourceData
     * @param cb
     */
    async flush(sourceData, taskConf, cb) {
        for (let type in sourceData) {
            let datas = sourceData[type];
            if (datas.length === 0) {
                continue;
            }

            let len = datas.length;
            let sql = this.sqlTemplate[type];
            while(true){
                let writeData = datas.splice(0, taskConf.writeLimit);
                let values = this._buildValues(writeData);
                try {
                    await mysqlConnector.insert(sql + values);
                } catch (error) {
                    logger.error('sql = ', sql);
                    logger.error('values = ', values);
                    logger.error('批量日志类型:' + type + '插入失败,' + error);
                }

                if(datas.length === 0){
                    break;
                }
            }

            logger.info('批量日志类型:' + type + '插入成功,数量', len);
        }
        utils.invokeCallback(cb, null);
    }

    /**
     * 根据字段条目生成占位符?
     * @param fields
     * @returns {string}
     * @private
     */
    _genPlaceholder(fields) {
        let placeholder = '';
        for (let i = 1; i <= fields.length; ++i) {
            placeholder += '?';
            if (i !== fields.length) {
                placeholder += ',';
            }
        }

        return placeholder;
    }

    /**
     * 初始化创建日志写入sql
     * @private
     */
    _init() {
        for (let type in logTableDef.TABLE) {
            let table = logTableDef.TABLE[type];
            // let sql = `INSERT INTO ${table.name} (${table.field.join()}) VALUES (${this._genPlaceholder(table.field)})`;
            let sql = `INSERT INTO ${table.name} (${table.field.join()}) VALUES `;
            this.sqlTemplate[type] = sql;
        }
    }

    _buildValues(datas) {
        let values = '';
        for (let i = 0; i < datas.length; ++i) {
            let data = datas[i];
            let row = '';
            for (let i = 0; i < data.length; ++i) {
                let field = data[i];
                if (typeof field == 'string') {
                    field = `'${field}'`;
                }
                row += field;
                row += ',';
            }
            values += `(${row.slice(0,-1)}),`;
        }
        return values.slice(0, -1);
    }

}

module.exports = new MysqlLogInsert();