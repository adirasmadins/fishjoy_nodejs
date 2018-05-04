const cwd = process.cwd();
const envConfig = require(cwd + '/app/config/env.json');
const config = require(cwd + '/app/config/' + envConfig.env + '/config');
const OmeloWSClient = require(cwd + '/app/omelo-wsclient/wsclient');
const httpclient = require(cwd + '/app/omelo-wsclient/httpclient');
const genInerUser = require(cwd + '/app/data/fishjoy/genInerUser');
const TaskReport = require(cwd + '/app/script/common/taskReport');
const taskReport = new TaskReport();

const START = 'start';
const END = 'end';
const REPORT = 'onReport'; //测试结果报告

const ActFlagType = {
    QUERYENTRY: 0,
    C_ENTER_ROOM: 1,
    C_HEARTBEAT: 2,
    C_FIRE: 3,
    C_CATCH_FISH: 4,
    C_GATE_SEND: 5,
};

function monitor(type, name, reqId) {
    if (typeof actor !== 'undefined') {
        global.actor.emit(type, name, reqId);
    } else {
        logger.error(Array.prototype.slice.call(arguments, 0));
    }
}

function report(result) {
    taskReport.emit(REPORT, result);
}

const GATE_URL = "http://192.168.35.211:3002";



class Fishjoy {
    constructor() {
        this._client = new OmeloWSClient();
        this._client.on('io-error', this._sockeError.bind(this));
        this._recover = null;
        this._state = false;
        this._heartbeat = null;
        this._fireTimer = null;
        // this._stressTimer = null;
        this._catchTimer = null;
        this._heartbeat_fail_count = 0;
        this._fireIdx = 0;
        this._myUID = null;
        this._account = null;
        this._gameAddress = {
            ip: '',
            port: 0
        };
    }

    async start() {
        // this._heartbeat = setInterval(this.sendHeartbeat.bind(this), 3000);
        // this._fireTimer = setInterval(this.sendFire.bind(this), 250);
        // this._stressTimer = setInterval(this.stressTest.bind(this), 50);
        this.initListener();

        await this._loginGate();
    }

    stop() {
        if (this._heartbeat) {
            clearInterval(this._heartbeat);
        }
        if (this._fireTimer) {
            clearInterval(this._fireTimer);
        }
    }

    initListener() {
        this._client.on('s_enter_room', this.s_enter_room.bind(this));
        this._client.on('s_leave_room', this.s_leave_room.bind(this));
        this._client.on('s_playerState', this.s_playerState.bind(this));
        this._client.on('s_fire', this.s_fire.bind(this));
        this._client.on('s_catch_fish', this.s_catch_fish.bind(this));
        this._client.on('s_use_skill', this.s_use_skill.bind(this));
        this._client.on('s_use_skill_end', this.s_use_skill_end.bind(this));
        this._client.on('s_flush_fish', this.s_flush_fish.bind(this));
        this._client.on('s_fighting_notify', this.s_fighting_notify.bind(this));
        this._client.on('s_player_notify', this.s_player_notify.bind(this));
    }

    s_enter_room(msg) {
        let data = msg.data;
        for (let i = 0; i < data.length; i++) {
            let v = data[i];
            let uid = v.id;
            if (uid == this._myUID) {
                this._myData = data[i];
                break;
            }
        }
        // logger.error('s_enter_room:', data);
    }

    s_leave_room(data) {
        // logger.error('s_leave_room:', data);
    }

    s_playerState(data) {
        // logger.error('s_playerState:', data);
    }

    s_fire(data) {
        // logger.error('s_fire:', data);
    }

    s_catch_fish(data) {
        // logger.error('s_catch_fish:', data);
    }

    s_use_skill(data) {
        logger.error('s_use_skill:', data);
    }

    s_use_skill_end(data) {
        logger.error('s_use_skill_end:', data);
    }

    s_flush_fish(data) {
        // logger.error('s_flush_fish:', data);
    }

    s_fighting_notify(data) {
        // logger.error('s_fighting_notify:', data);
    }

    s_player_notify(data) {
        // logger.error('s_player_notify:', data);
    }

    async sendHeartbeat() {
        try {
            if (this._state) {
                await this._request('game.fishHandler.c_heartbeat', {}, ActFlagType.C_HEARTBEAT);
                this._heartbeat_fail_count = 0;
            }
        } catch (err) {
            this._heartbeat_fail_count++;
            // logger.error('sendHeartbeat fail count:', this._heartbeat_fail_count, 'err:', err);
        }
    }

    async stressTest() {
        // logger.error('-------------------------start');
        let res = await this._request('chat.chatHandler.send', {
            enc: null,
            data: {
                bigdata: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
            }
        }, ActFlagType.C_GATE_SEND);

        // logger.error('-------------------------res');
    }

    async sendFire() {
        try {
            if (this._state && this._myData) {
                let wp_level = this._myData.wp_level;
                let wp_skin = this._myData.wp_skin;
                let seatId = this._myData.seatId;
                let bk = seatId + '_' + wp_skin + '_' + wp_level + '_' + this._fireIdx;
                let targetFishKey = null;
                let data = {
                    wp_level: wp_level,
                    wp_skin: wp_skin,
                    fire_point: {
                        x: 100,
                        y: 200
                    },
                    wp_bk: bk,
                    // fire_fish: targetFishKey,
                };
                if (!this._fireData) {
                    this._fireData = [];
                }
                this._fireData.push(data);
                await this._request('game.fishHandler.c_fire', {
                    // enc:null,
                    data: data
                }, ActFlagType.C_FIRE);
                this._fireIdx++;

                let rC = 1 + Math.floor(Math.random() * 5);
                if (this._fireIdx % rC === 0) {
                    this.sendCatch();
                }

            }
        } catch (err) {
            logger.error('sendFire fail:', 'err:', err);
        }
    }

    async sendCatch() {
        try {
            if (this._state && this._fireData) {
                //玩家自己 普通皮肤 60倍开炮,一炮命中随机1到10条鱼
                let sdata = [];
                for (let j = 0; j < this._fireData.length; j++) {
                    let fd = this._fireData[j];
                    let bk = fd.wp_bk;
                    let _data = {
                        wp_bk: bk,
                        fishes: [],
                        skill_ing: [],
                    };
                    let fishes = _data.fishes;
                    let rC = 1 + Math.floor(Math.random() * 10);
                    for (let i = 0; i < rC; i++) {
                        fishes.push({
                            nameKey: "jiaodie_huang__" + i,
                            fishPos: {
                                x: 647.6021703999365,
                                y: 274.54921198960136
                            }
                        });
                    }
                    sdata.push(_data);
                }
                this._fireData = null;
                await this._request('game.fishHandler.c_catch_fish', {
                    // enc:null,
                    data: {
                        b_fishes: sdata
                    }
                }, ActFlagType.C_CATCH_FISH);
            }
        } catch (err) {
            logger.error('sendCatch fail:', 'err:', err);
        }
    }

    /**
     * 网络io错误
     * @param {异常原因} reason 
     */
    _sockeError(reason) {
        this._client.removeAllListeners('disconnect');
        logger.error('网络IO错误,自动重连中...', reason);
        this._state = false;
        setTimeout(this.joinGame.bind(this), 10000);
    }

    /**
     * 用户会话断开
     * @param {断开原因} reason 
     */
    _offline(reason) {
        this._client.removeAllListeners('disconnect');
        logger.error('会话断开,自动重连中disconnect...', this._myUID);
        this._state = false;
        setTimeout(this.joinGame.bind(this), 10000);
    }
    /**
     * websocket握手
     * @param {ip地址} host 
     * @param {端口} port 
     */
    _handshake(host, port) {
        let self = this;
        return new Promise(function (resolve, reject) {
            self._client.init({
                host: host,
                port: port,
                log: true
            }, function (err) {
                if (err) {
                    logger.error('握手失败:', err);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * 发送用户请求
     * @param {路由} route 
     * @param {请求body} msg 
     */
    _request(route, msg, actFlagType) {
        let self = this;
        return new Promise(function (resolve, reject) {
            monitor('incr', route);
            monitor(START, route, actFlagType);
            self._client.request(route, msg, function (response) {
                monitor(END, route, actFlagType);
                report({
                    route: route,
                    response: response
                });
                if (response && response.code === 500) {
                    reject({
                        code: 500,
                        desc: '服务器内部错误'
                    });
                    return;
                }

                if (response.result.code != 200) {
                    reject(response.result);
                    return;
                }
                resolve(response.msg && response.msg.data || response.result);
            });
        });
    }

    async _queryEntry(host, port) {
        let self = this;
        return new Promise(async function (resolve, reject) {
            try {
                await self._handshake(host, port);
                const route = 'gate.gateHandler.queryEntryEx';
                let entry = await self._request(route, {}, ActFlagType.QUERYENTRY);
                resolve([entry.host, entry.port]);
            } catch (err) {
                logger.error(err);
                reject(err);
            }
        });
    }


    async _getRobotToken() {
        if (!this._myUID) {
            this._myUID = genInerUser.get_uid_ex();
        }
        let token = this._myUID + '_03458cd087cb11e7ba758392291a4bfa';
        logger.error('token:', token);
        return token;
    }

    _getLoginInfo() {
        if (!this._myUID) {
            this._myUID = genInerUser.get_uid_ex();
        }
        return {
            username: "stressTestUser" + this._myUID,
            password: genInerUser.getDefaultPassword()
        };
    }

    _getScene() {
        return 'scene_mutiple_1';
    }

    async _loginGate() {
        try {
            let account = await httpclient.postData({
                data: this._getLoginInfo()
            }, GATE_URL + "/account_api/login")
            this._account = account;
            return true;
        } catch (e) {
            console.error('http _loginGate err', e);
        }

        return false;
    }

    async getServerList() {
        try {
            let account = await httpclient.postData({
                data: this._getLoginInfo()
            }, GATE_URL + "/account_api/login")
            this._account = account;
            return true;
        } catch (e) {
            console.error('getServerList err', e);
        }

        return false;
    }

    async joinGame() {
        try {
            // await genInerUser.initialize();


            return;

            if (!this._recover) {

                let [host, port] = await this._queryEntry('172.16.1.5', 3021);
                // let [host, port] = await this._queryEntry('192.168.35.211', 3021);
                // logger.error('connector host port:', host, port);
                this._gameAddress.ip = host;
                this._gameAddress.port = port;
            }

            await this._handshake(this._gameAddress.ip, this._gameAddress.port);

            const route = "game.fishHandler.c_enter_room";
            let response = await this._request(route, {
                // enc: null,
                data: {
                    token: await this._getRobotToken(),
                    flag: 1, // 多人房标记true，默认单人房false
                    scene_name: this._getScene(), //准备进入的场景名
                    // recover: this._recover
                }
            }, ActFlagType.C_ENTER_ROOM);

            this._client.on('disconnect', this._offline.bind(this));
            this._recover = response;
            this._state = true;
            this.sendHeartbeat();
            // logger.error('c_enter_room response:', response);
        } catch (err) {
            this._recover = null;
            this._state = false;
            logger.error('加入游戏失败，err:', err);
            logger.error('加入游戏失败,自动重连中...');
            setTimeout(this.joinGame.bind(this), 10000);
        }

    }
}

let fish = new Fishjoy();
fish.start();