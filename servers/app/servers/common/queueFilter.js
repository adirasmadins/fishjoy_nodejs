class QueueFilter {
  constructor() {
    this.requestQueue = [];
    this.apiFilterWaitCount = 0;
    this.msgTotalInCount = 0;
    this.msgTotalOutCount = 0;
    this.apiFilterWaitCountHighLimit = 100;
    this.apiFilterWaitCountLowLimit = 30;

    this.routeMap = new Map();

    setInterval(function(){
      this._printf();
    }.bind(this), 10000);
  }

  _printf(){
    for(let [k,v] of this.routeMap){
        logger.info(k,' in qps:', v.inMsg/((Date.now() - v.beginTime)/1000), '次每秒');
        logger.info(k,' out qps:', v.outMsg/((Date.now() - v.beginTime)/1000), '次每秒');
    }
  }

  handlerQueue() {
    let handlerQueueCount = this.apiFilterWaitCountLowLimit - this.apiFilterWaitCount;
    logger.info('[doHandlerQueue]lowLimit : %s,waitCount : %s,queueCount : %s', this.apiFilterWaitCountLowLimit, this.apiFilterWaitCount, handlerQueueCount);
    for (let i = 0; i < handlerQueueCount && i < this.requestQueue.length; i++) {
      let handlerNextItem = this.requestQueue.shift();
      logger.info('[queue]pop : %s', this.requestQueue.length);
      this.apiFilterWaitCount++;
      logger.info('[queue]this.apiFilterWaitCount++ : %s', this.apiFilterWaitCount);
      process.nextTick(function () {
        handlerNextItem.next();
      });
    }
  }

  requestQueuePush(queueItem) {
    this.requestQueue.push(queueItem);
    logger.info('[queue]push : %s', this.requestQueue.length);
  }

  before(msg, session, next){
    let obj = this.routeMap.get(msg.__route__);
    if(!obj){
      obj = {
        inMsg:0,
        outMsg:0,
        beginTime:Date.now()
      };
      this.routeMap.set(msg.__route__, obj);
    }
    obj.inMsg++;

    logger.info('this.msgTotalInCount=%s', this.msgTotalInCount++);
    if (this.requestQueue.length > 0) {
      //push to queue
      this.requestQueuePush({
        next: next
      });
    } else {
      if (this.apiFilterWaitCount < this.apiFilterWaitCountHighLimit) {
        //push to api
        this.apiFilterWaitCount++;
        logger.info('[direct]this.apiFilterWaitCount++ : %s', this.apiFilterWaitCount);
        next();
        return;
      } else {
        //push to queue
        this.requestQueuePush({
          next: next
        });
      }
    }

    if (this.apiFilterWaitCount < this.apiFilterWaitCountLowLimit) {
      logger.info('[BeforeCallQueue]');
      this.handlerQueue();
    }
  }

  after(err, msg, session, resp, next){
    let obj = this.routeMap.get(msg.__route__);
    obj.outMsg++;

    this.apiFilterWaitCount--;
    logger.info('this.apiFilterWaitCount-- : %s', this.apiFilterWaitCount);
    logger.info('this.msgTotalOutCount=%s', this.msgTotalOutCount++);
    if (this.apiFilterWaitCount < this.apiFilterWaitCountLowLimit) {
      logger.info('[AfterCallQueue]');
      this.handlerQueue();
    }
    next(err, msg);
  }
}

module.exports = new QueueFilter();
