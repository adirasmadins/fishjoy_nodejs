const logTableDef = require('./logTableDef');
const errorCode = require('../task').errorCode;

class LogSource{
    constructor(){
        this._datas = {};
        this._init();
    }

    /**
     * 加入日志数据
     * @param type
     * @param data
     * @returns {*}
     */
    add(type, data){
        if(this._checkLogType(type)){
            return errorCode.TYPE_ERROR;
        }

        let dataArr = this._checkData(type, data);
        if(dataArr.length === 0){
            return errorCode.DATA_INVALID;
        }

        this._datas[type].push(dataArr);

        return errorCode.OK;
    }

    /**
     * 获取Log数据源
     * @returns {{}|*}
     */
    get data(){
        return this._datas;
    }


    /**
     * 校验数据
     * @param type
     * @param data
     * @private
     */
     _checkData(type, data){
        let temp = [];
        let fields = logTableDef.TABLE[type].field;
        for(let i = 0; i< fields.length; ++i){
            if(data[fields[i]] !== undefined && data[fields[i]] !== null){
                temp.push(data[fields[i]]);
            }else {
                return [];
            }
        }
        return temp;
    }

    /**
     * 检查日志类型
     * @param type
     * @returns {boolean}
     * @private
     */
    _checkLogType(type){
        if(logTableDef.TYPE[type]){
            return true;
        }
        return false;
    }

    /**
     * 初始化
     * @private
     */
    _init(){
        for(let key in logTableDef.TYPE){
            this._datas[logTableDef.TYPE[key]] = [];
        }
    }
}

module.exports = LogSource;