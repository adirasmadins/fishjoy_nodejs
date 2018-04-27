const ERROR_OBJ = require('../../consts/fish_error').ERROR_OBJ;

function RemoteHandler(){
}

RemoteHandler.registe = function(method, prototype, server){
    prototype[method] = function (data, cb) {
        if(typeof data === 'function') cb = data;
        server.remoteRpc(method, data, function(err, result){
            utils.invokeCallback(cb, err, result || ERROR_OBJ.Error);
        }); 
    };
};

module.exports = RemoteHandler;