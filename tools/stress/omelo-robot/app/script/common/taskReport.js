const EventEmitter = require('events').EventEmitter;


class TaskReport extends EventEmitter{
    constructor(){
        super();
        this.on('onReport', this._report.bind(this));
    }

    /**
     *  
     * @param {测试结果数据} result 
     */
    _report(result){

        if(result.response.result && result.response.result.code != 200 || result.response && result.response.code === 500){
             console.log('失败：', JSON.stringify(result));
        }
        else{
            // console.log('成功：',  JSON.stringify(result)); 
        }
    }
}

module.exports = TaskReport;