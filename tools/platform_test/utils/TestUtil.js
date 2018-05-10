const CFG_SERVERS = require('../configs/servers');
const request = require('supertest')(CFG_SERVERS.DB_SERVER);

class TestUtil {

    handleApiResponse(resolve, reject, err, res) {
        if (err) {
            reject(err);
            return;
        }

        let body = res.body;
        if (body.err) {
            reject(body.err);
            return;
        }
        else {
            resolve(body.data);
            return;
        }
    }

    handleAdminResponse(resolve, reject, err, res) {
        if (err) {
            reject(err);
            return;
        }
        if (res) {
            let text = JSON.parse(res.res.text);
            if (text.data) {
                resolve(text.data);
                return;
            }
            else {
                reject(text.data.err);
                return;
            }
        }
    }

    /**
     * 向数据库服务器请求SQL语句的执行.
     * @param {*} sql 
     */
    runMySQLScript(sql) {
        return new Promise((resolve, reject) => {
            request.post('/runMySQLScript')
                .send({ sql: sql })
                .end(function (err, res) {
                    if (err) {
                        console.log('err:', err);
                        reject(err);
                        return;
                    }
                    if (res) {
                        // console.log('body:', res.body);
                        resolve(res.body);
                        return;
                    }
                });
        });
    }

    /**
     * 向数据库服务器请求Redis语句的执行.
     * @param {*} sql 
     */
    runRedisScript(data) {
        return new Promise((resolve, reject) => {
            request.post('/runRedisScript')
                .send({ data: data })
                .end(function (err, res) {
                    if (err) {
                        console.log('err:', err);
                        reject(err);
                        return;
                    }
                    if (res) {
                        // console.log('body:', res.body);
                        resolve(res.body);
                        return;
                    }
                });
        });
    }
}

module.exports = new TestUtil();