const User = require('./user');
const http = require('http');

class CocoUser extends User {
    constructor(config) {
        super();
        this._config = config;
    }

    getUserInfo(data) {
        let token = data.token;
        let url = `${this._config.url}?cmd=checkUserToken&userToken=${token}`;
        console.log(url);
        return new Promise(function (resolve, reject) {
            http.get(url, function (resp) {
                let result = "";
                resp.on("data", function (data) {
                    result += data.toString();
                });
                resp.on("end", function () {
                    if (!result) {
                        reject('网络异常');
                        return;
                    }
                    console.log('17525 sdk get user info result:', result);
                    result = JSON.parse(result);
                    if(result.error) {
                        console.log("渠道登录错误:",result.error);
                        reject(result.error);
                    }else {
                        let userInfo = {
                            openid:result.uid,
                            nickname:result.nickname,
                            figure_url:result.headimgurl
                        };
                        resolve(userInfo);
                    }
                });
            });
        });

    }
}

module.exports = CocoUser;