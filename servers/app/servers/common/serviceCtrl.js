const serviceSwitch = require('./serviceSwitch');

class ServiceCtrl{
    //启用系统停机维护
    async enableSysShutdow(){
        await serviceSwitch.enableSwitch();
    }
}

module.exports = new ServiceCtrl();