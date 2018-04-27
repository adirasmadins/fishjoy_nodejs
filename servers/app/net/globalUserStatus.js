const omelo = require('omelo');

class GlobalUserStatus{
    /**
     * 获取用户前端服务器ID
     * @param uid
     */
    getUserSid(uid){
        return new Promise(function (resolve, reject) {
            omelo.app.get('statusService').getSidsByUid(uid, function (err, list) {
                if(err){
                    reject(err);
                }else {
                    let sid = list && list[0];
                    resolve(sid);
                }
            });
        });
    }

    /**
     * 获取用户在线状态
     * @param uid
     */
    getUserStatus(uid){
        return new Promise(function (resolve, reject) {
            omelo.app.get('statusService').getStatusByUid(uid, function (err, status) {
                if(err){
                    reject(err);
                }else {
                    resolve(status);
                }
            });

        });
    }
}

module.exports = new GlobalUserStatus();