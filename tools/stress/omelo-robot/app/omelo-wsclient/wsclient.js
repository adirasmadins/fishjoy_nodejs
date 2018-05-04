const EventEmitter = require('events').EventEmitter;
const cwd = process.cwd();
const Protocol = require(cwd + '/app/omelo-wsclient/protocol');
const protobuf = require(cwd + '/app/omelo-wsclient/protobuf');
const Package = Protocol.Package;
const Message = Protocol.Message;
const webSocket = require('ws');

const JS_WS_CLIENT_TYPE = 'js-websocket';
const JS_WS_CLIENT_VERSION = '1.0.0.1';
const RES_OK = 200;
const RES_FAIL = 500;
const RES_OLD_CLIENT = 501;

class Pomelo extends EventEmitter {
    constructor() {
        super();
        this.socket = null;
        this.reqId = 0;
        this.callbacks = {};
        this.handlers = {};
        this.handlers[Package.TYPE_HANDSHAKE] = this.handshake.bind(this);
        this.handlers[Package.TYPE_HEARTBEAT] = this.heartbeat.bind(this);
        this.handlers[Package.TYPE_DATA] = this.onData.bind(this);
        this.handlers[Package.TYPE_KICK] = this.onKick.bind(this);
        //Map from request id to route
        this.routeMap = {};

        this.heartbeatInterval = 0;
        this.heartbeatTimeout = 0;
        this.nextHeartbeatTimeout = 0;
        this.gapThreshold = 100; // heartbeat gap threashold
        this.heartbeatId = null;
        this.heartbeatTimeoutId = null;

        this.handshakeCallback = null;

        this.decode = null;
        this.encode = null;

        this.useCrypto;
        this.handshakeBuffer = {
            'sys': {
                type: JS_WS_CLIENT_TYPE,
                version: JS_WS_CLIENT_VERSION
            },
            'user': {}
        };

        this.initCallback = null;
        this._params = null;
        this.data = null;
    }

    init(params, cb) {
        this._params = params;
        this.initCallback = cb;
        let host = params.host;
        let port = params.port;

        let url = 'ws://' + host;
        if (port) {
            url += ':' + port;
        }

        this.handshakeBuffer.user = params.user;
        this.handshakeCallback = params.handshakeCallback;
        this.initWebSocket(url);
    }

    _onOpen(event){
        let obj = Package.encode(Package.TYPE_HANDSHAKE, Protocol.strencode(JSON.stringify(this.handshakeBuffer)));
        this.send(obj);
    }

    _onMessage(event){
        this.processPackage(Package.decode(event.data));
        // new package arrived, update the heartbeat timeout
        if (this.heartbeatTimeout) {
            this.nextHeartbeatTimeout = Date.now() + this.heartbeatTimeout;
        }
    }

    _onError(event){
        this.emit('io-error', event);
    }

    _onClose(event){
        logger.error('_onClose .....');
        this.emit('close', event);
        this.emit('disconnect', event);
        if(this.socket){
            this.socket = null;
        }
    }


    initWebSocket(url) {
        this.socket = new webSocket(url);
        this.socket.binaryType = 'arraybuffer';
        this.socket.onopen = this._onOpen.bind(this);
        this.socket.onmessage = this._onMessage.bind(this);
        this.socket.onerror = this._onError.bind(this);
        this.socket.onclose = this._onClose.bind(this);
    }

    disconnect() {
        if (this.socket) {
            if (this.socket.disconnect) this.socket.disconnect();
            if (this.socket.close) this.socket.close();
            logger.error('disconnect');
            this.socket = null;
        }

        if (this.heartbeatId) {
            clearTimeout(this.heartbeatId);
            this.heartbeatId = null;
        }
        if (this.heartbeatTimeoutId) {
            clearTimeout(this.heartbeatTimeoutId);
            this.heartbeatTimeoutId = null;
        }
    }

    request(route, msg, cb) {
        if (arguments.length === 2 && typeof msg === 'function') {
            cb = msg;
            msg = {};
        } else {
            msg = msg || {};
        }
        route = route || msg.route;
        if (!route) {
            return;
        }

        this.reqId++;
        this.sendMessage(this.reqId, route, msg);

        this.callbacks[this.reqId] = cb;
        this.routeMap[this.reqId] = route;
    }

    notify(route, msg) {
        msg = msg || {};
        this.sendMessage(0, route, msg);
    }

    sendMessage(reqId, route, msg) {
        let type = reqId ? Message.TYPE_REQUEST : Message.TYPE_NOTIFY;

        //compress message by protobuf
        let protos = !!this.data.protos ? this.data.protos.client : {};
        if (!!protos[route]) {
            // logger.error('protos------------1 ',route, msg)
            // logger.error('protos------------1 len ',route, JSON.stringify(msg).length)
            msg = protobuf.encode(route, msg);
            // if(msg){
            //     logger.error('protos------------2 ',route, msg)
            //     logger.error('protos------------2 len',route, msg.length)
            // }

        } else {
            // logger.error('json------------1 ',route, msg)
            // logger.error('json------------1 len ',route, JSON.stringify(msg).length)
            msg = Protocol.strencode(JSON.stringify(msg));
            // logger.error('json------------2 ',route, msg)
            // logger.error('json------------2 len',route, msg.length)
        }


        let compressRoute = 0;
        if (this.dict && this.dict[route]) {
            route = this.dict[route];
            compressRoute = 1;
        }

        msg = Message.encode(reqId, type, compressRoute, route, msg);
        let packet = Package.encode(Package.TYPE_DATA, msg);
        this.send(packet);
    }

    send(packet) {
        if(this.socket){
            this.socket.send(packet.buffer);
        }
    }

    heartbeatTimeoutCb() {
        let gap = this.nextHeartbeatTimeout - Date.now();
        if (gap > this.gapThreshold) {
            this.heartbeatTimeoutId = setTimeout(this.heartbeatTimeoutCb.bind(this), gap);
        } else {
            logger.error('server heartbeat timeout');
            this.emit('heartbeat timeout');
            this.disconnect();
        }
    };


    heartbeat(data) {
        if (!this.heartbeatInterval) {
            // no heartbeat
            return;
        }

        let obj = Package.encode(Package.TYPE_HEARTBEAT);
        if (this.heartbeatTimeoutId) {
            clearTimeout(this.heartbeatTimeoutId);
            this.heartbeatTimeoutId = null;
        }

        if (this.heartbeatId) {
            // already in a heartbeat interval
            return;
        }

        this.heartbeatId = setTimeout(function () {
            this.heartbeatId = null;
            this.send(obj);

            this.nextHeartbeatTimeout = Date.now() + this.heartbeatTimeout;
            this.heartbeatTimeoutId = setTimeout(this.heartbeatTimeoutCb, this.heartbeatTimeout);
        }.bind(this), this.heartbeatInterval);
    }

    handshake(msg) {
        let data = JSON.parse(Protocol.strdecode(msg));
        let err = null;
        if (data.code === RES_OLD_CLIENT) {
            this.emit('error', 'client version not fullfill');
            err = 'client version not fullfill';
        }

        if (data.code !== RES_OK) {
            this.emit('error', 'handshake fail');
            err = 'handshake fail';
        }

        if (this.initCallback) {
            this.initCallback(err, this.socket);
            if(err){
                return;
            }
            this.initCallback = null;
        }

        this.handshakeInit(data);
        let obj = Package.encode(Package.TYPE_HANDSHAKE_ACK);
        this.send(obj);
    };

    onData(data) {
        //probuff decode
        let msg = Message.decode(data);

        if (msg.id > 0) {
            msg.route = this.routeMap[msg.id];
            delete this.routeMap[msg.id];
            if (!msg.route) {
                return;
            }
        }

        msg.body = this.deCompose(msg);

        this.processMessage(msg);
    };

    onKick(data) {
        data = JSON.parse(Protocol.strdecode(data));
        this.emit('onKick', data);
    };

    processPackage(msgs) {
        if (Array.isArray(msgs)) {
            for (let i = 0; i < msgs.length; i++) {
                let msg = msgs[i];
                this.handlers[msg.type](msg.body);
            }
        } else {
            this.handlers[msgs.type](msgs.body);
        }
    };

    processMessage(msg) {
        if (!msg.id) {
            // server push message
            this.emit(msg.route, msg.body);
        }

        //if have a id then find the callback function with the request
        let cb = this.callbacks[msg.id];

        delete this.callbacks[msg.id];
        if (typeof cb !== 'function') {
            return;
        }
        cb(msg.body);
        return;
    };

    processMessageBatch(msgs) {
        for (let i = 0, l = msgs.length; i < l; i++) {
            this.processMessage(msgs[i]);
        }
    }

    deCompose(msg) {
        let protos = !!this.data.protos ? this.data.protos.server : {};
        let abbrs = this.data.abbrs;
        let route = msg.route;

        //Decompose route from dict
        if (msg.compressRoute) {
            if (!abbrs[route]) {
                return {};
            }

            route = msg.route = abbrs[route];
        }
        if (!!protos[route]) {
            return protobuf.decode(route, msg.body);
        } else {
            return JSON.parse(Protocol.strdecode(msg.body));
        }
    }

    handshakeInit(data) {
        if (data.sys && data.sys.heartbeat) {
            this.heartbeatInterval = data.sys.heartbeat * 1000; // heartbeat interval
            this.heartbeatTimeout = this.heartbeatInterval * 2; // max heartbeat timeout
        } else {
            this.heartbeatInterval = 0;
            this.heartbeatTimeout = 0;
        }

        this.initData(data);

        if (typeof (this.handshakeCallback) === 'function') {
            this.handshakeCallback(data.user);
        }
    }

    initData(data) {
        // logger.error('protocol ------------- data:', data);
        if (!data || !data.sys) {
            return;
        }
        this.data = this.data || {};
        let dict = data.sys.dict;
        let protos = data.sys.protos;

        //Init compress dict
        if (dict) {
            this.data.dict = dict;
            this.data.abbrs = {};

            for (let route in dict) {
                this.data.abbrs[dict[route]] = route;
            }
        }

        //Init protobuf protos
        if (protos) {
            this.data.protos = {
                server: protos.server || {},
                client: protos.client || {}
            };
            if (!!protobuf) {
                protobuf.init({
                    encoderProtos: protos.client,
                    decoderProtos: protos.server
                });
            }
        }
    }
}

module.exports = Pomelo;