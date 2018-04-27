const https = require('https');
const User = require('./user');
const ERROR_OBJ = require('../../../../consts/fish_error').ERROR_OBJ;

class GooglePlusUser extends User {
  constructor() {
    super();
    this._baseInfo_url = 'https://www.googleapis.com/oauth2/v3/tokeninfo';
  }

  getUserInfo(data) {
    return new Promise(function (resolve, reject) {
      let req = https.get(`${this._baseInfo_url}?id_token=${data.id_token}`, (res) => {
        if (res.statusCode !== 200) {
          reject(res.statusMessage);
          return;
        }
        let bufCache = '';
        res.setEncoding('utf-8');
        res.on('data', (chunk) => {
          bufCache += chunk;
        });

        res.on('end', () => {
          try {
            let sdkInfo = JSON.parse(bufCache);
            let info = {};
            if (sdkInfo) {
              info.nickname = sdkInfo.name;
              info.sex = 'male' == sdkInfo.gender ? 1 : 0;
              info.city = sdkInfo.locale || 'secret';
              info.figure_url = sdkInfo.picture;
              info.openid = sdkInfo.sub;
              resolve(info);
            } else {
              logger.error('googlePlus sdkInfo empty');
              reject('googlePlus sdkInfo empty');
            }
          } catch (err) {
            logger.error(err);
            reject(ERROR_OBJ.CALL_SDK_FAIL);
          }
        });

      });

      req.on('error', (err) => {
        logger.error(err);
        reject(err);
      });
    }.bind(this));

  }

}

module.exports = GooglePlusUser;