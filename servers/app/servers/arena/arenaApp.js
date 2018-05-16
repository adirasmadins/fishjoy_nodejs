const omelo = require('omelo');
const GAME_TYPE = require('../../utils/imports').sysConfig.GAME_TYPE;
const plugins = require('../../plugins');
const {RedisConnector, MysqlConnector} = require('../../database/dbclient');

class ArenaApp{
    constructor(){
        this._instance = new plugins[GAME_TYPE].MatchRankInstance();
    }

    async start(){
        this._redisConnector = new RedisConnector();
        let result = await this._redisConnector.start(omelo.app.get('redis'));
        if (!result) {
            process.exit(0);
            return;
        }
        this._mysqlConnector = new MysqlConnector();
        result = await this._mysqlConnector.start(omelo.app.get('mysql'));
        if (!result) {
            process.exit(0);
            return;
        }
    }

    stop(){

    }
}

module.exports = ArenaApp;