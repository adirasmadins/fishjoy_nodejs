const errorCode = require('./errorCode');
const Task = require('./task');

class TaskPool{
    constructor(){
        this._taskMap = new Map();
    }

    /**
     * 添加任务
     * @param tid
     * @param task
     * @returns {*}
     */
    addTask(tid, task){
        if(!task.config.enable){
            return errorCode.TASK_NOT_ENABLE;
        }

        if(!task || !(task instanceof Task)){
            return errorCode.TASK_INVALID;
        }

        task.taskId = tid;

        this._taskMap.set(tid, task);

        task.run();

        return errorCode.OK;
    }

    /**
     * 移除任务
     * @param tid
     */
    removeTask(tid){
        if(tid){
            let task = this._taskMap.get(tid);
            if(task){
                task.cancle();
            }
            this._taskMap.delete(tid);
        }
        else {
            for(let task of this._taskMap.values()){
                task.cancle();
            }
            this._taskMap.clear();
        }
    }
}

module.exports = new TaskPool();