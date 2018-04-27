class Cron{
    constructor(app){
        this.app = app;
    }

    update(){
        // logger.info('Cron test call');
    }
}

module.exports = function (app) {
    return new Cron(app);
};