// //--[[
// description: 所有鱼的数据数据结构，注意不是单条鱼
// author: scott (liuwenming@chufengnet.com)
// date: 20160509
// ATTENTION：
// //--]]
const GAMECFG = require('../../utils/imports').DESIGN_CFG;
const FISH_CFGS = GAMECFG.fish_fish_cfg;
const SCENE_CFGS = GAMECFG.scene_scenes_cfg;
const TIDE_CFGS = GAMECFG.scene_tide_cfg;
const PATH_CFGS = GAMECFG.scene_paths_cfg;
const SKILL_CFGS = GAMECFG.skill_skill_fish_cfg;
const ALL_MERGE = GAMECFG.all_merge;
const versions = require('../../utils/imports').versions;

const LIFE_OFFSET = 1;
const DEBUG = 0;


let _debugTest = 0;

//自定义抛出一异常
let assertThrow = function (mustBeTrue, msg) {  
    if (!mustBeTrue) {
        throw msg;
    }
};

//克隆一个对象
let clone = null;
clone = function(obj) {  
    let buf;  
    if (obj instanceof Array) {  
        buf = [];  //创建一个空的数组
        let i = obj.length;  
        while (i > 0 && i--) {  
            buf[i] = clone(obj[i]);  
        }  
        return buf;  
    }else if (obj instanceof Object){  
        buf = {};  //创建一个空对象
        for (let k in obj) {  //为这个对象添加新的属性
            buf[k] = clone(obj[k]);  
        }  
        return buf;  
    }else{  
        return obj;  
    }  
};

//随机一个整数
let randomInt = function ( intRange ) {
    return Math.floor(Math.random()*intRange);
};

let FishAttribute = { //鱼属性,以后自己添加（通过施放技能，改变相应的属性）
    moveMultiple : 0, //移动速度加快倍数
    slowlyValue : 0, //炮弹减速倍数
    drageValue : 0, //闪避值
    rebound: 0, //反弹值
    // hitrate : 0, //提升命中率
    stealGold : 0 , //偷取金币
};

let _getPathCfg = function (name) {
    return ALL_MERGE && ALL_MERGE[name] || null;
};

//--粗略计算关键点构成的曲线长度 = 每两点之间的直线距离只和, 时间 ＝ 长度／速度
let genDtBySpeed =  function ( points, speed ) {
    let dis = 0;
    let len = points.length - 1;
    let pLast = points[len];
    while (len > 0 && len --) {
        let pCur = points[len];
        let tx = pCur.x - pLast.x;
        let ty = pCur.y - pLast.y;
        let d = Math.sqrt(tx*tx + ty*ty);
        dis = dis + d;
        pLast = pCur;
    }
    let dt = Math.ceil(dis*1.0/speed);
    return dt;
};

const consts = require('./consts');

class FishModel {

    constructor(evtor, currentSceneName) {
        this._evtor = evtor;
        this.resetAll();
        this._loadCfg(currentSceneName); 
    }

    resetAll() {
        this._lastStep = 0;
        this._actorData = {};
        this._deadHistory = {}; //死亡历史,鱼潮来临时清空现有历史        
        this._scenePaths = {}; //场景中已经出现的路径 
        this._id2Name = {}; //id与名称对应关系，id也可唯一标识
        this._rewardData = {}; //得分等奖励数据
        this._bcash = {}; //高频广播缓存
        this._fishBasePct = {};
        this._curBoosCount = 0;
        this._gFish = {};
    }

    //设置房间id
    setRoomId (roomId) {
        this._roomId = roomId;
    }

    //查找路径是否已存在
    _findPathExist (pathId) {
        let pKey = pathId.toString();
        let _scenePaths = this._scenePaths;
        if (!_scenePaths[pKey]) {
            _scenePaths[pKey] = {};
            _scenePaths[pKey].paths = clone(PATH_CFGS[pKey].name_list);
            _scenePaths[pKey].pnames = {};
        }else if (_scenePaths[pKey].paths.length === 0) {
            _scenePaths[pKey].paths = clone(PATH_CFGS[pKey].name_list);
            _scenePaths[pKey].pnames = {};
        }

        let paths = _scenePaths[pKey].paths;
        let rIdx = randomInt(paths.length);
        let pName = paths[rIdx];
        if (!_scenePaths[pKey].pnames[pName]) {
            _scenePaths[pKey].pnames[pName] = true;
            paths.splice(rIdx, 1);
            return (pName + ".json");
        }
        return this._findPathExist(pathId);
    }

    //--选取路径
    _selectPath ( fishCfg, pName ) {
        pName = pName || this._findPathExist(fishCfg.in_path);
        return pName;
    }

    selectPathName (fishCfg) {
        return this._findPathExist(fishCfg.in_path);
    }

    _getFishCfg (actorTypeName) {
        return FISH_CFGS[actorTypeName];
    }

    getFishCfgWithNamekey(nameKey) {
        let temp = nameKey.split('#');
        let fishID = temp[0];
        return this.getFishCfgWithID(fishID);
    }

    getFishCfgWithID (fishId) {
        let actorTypeName = this._id2Name[fishId];
        return this._getFishCfg(actorTypeName);
    }

    getFishName (fishId) {
        let actorTypeName = this._id2Name[fishId];
        return actorTypeName;
    }
    

    getLiveFish () {
        let tdata = {};
        for (let fk in this._actorData) {
            let fish = this._actorData[fk];
            if (fish && fish.lifeDt > 0 && fish.floor > 0) {
                tdata[fk] = {
                    passedDt: fish._lifeDtSaved - fish.lifeDt,
                };
                for (let k in fish) {
                    let val = fish[k];
                    if (k.indexOf('_') === 0 || k == 'nameKey' || typeof val === 'function') {
                        continue;
                    }
                    if (k === 'path') {
                        val = val.replace('.json', '');
                    }
                    tdata[fk][k] = val;
                }
            }
        }
        return tdata;
    }

    getActorData ( nameKey ){
        return this._actorData[nameKey];
    }

    getActorTotal ( ) {
        let actorArray = this._actorData;
        let count = actorArray ? Object.keys(actorArray).length : 0;
        return count;
    }

    //--生成一个max以内的名称键,失败的话注意检查是否已经超出了上限,注意是两个下划线
    genNameKey ( nameTable, name, max ){
        if (!max) {
            max = 9999;
        }
        let i = this._lastStep;
        this._lastStep ++;
        if (this._lastStep >= max) {
            this._lastStep = 0;
        }
        for (; i < max; i++) {
            let nameKey = name + "#" + i;
            if (!nameTable.hasOwnProperty(nameKey)) {
                return nameKey;
            }
        }
        DEBUG && logger.warn("Error, nameKey is null, actor count > " + max);
        return name + "__" + max;
    }

    destory () {
        for (let k in this._sceneFishCfg) {
            let fish = this._sceneFishCfg[k];
            fish.resetInterval = null;
        }
    }

    //加载配置，初始化默认参数
    _loadCfg (currentSceneName) {
        //配置合法性检查
        let len = TIDE_CFGS.length;
        while (len > 0 && len --) {
            let v = TIDE_CFGS[len];
            let during = v.during;
            let tideData = _getPathCfg(v.tide_file);
            let wave_group = tideData;
            let wgLen = wave_group.length;
            while (wgLen > 0 && wgLen --) {
                let jv = wave_group[wgLen];
                assertThrow(jv.start < during && jv.internal > 0, "Error, 单个鱼阵出现时间务必小于鱼潮持续时间。" + v.id);
                jv.dt = jv.internal;
            }
            v.wave_group = wave_group;
        }

        let totalPercent = 100;
        let sceneCfgs = SCENE_CFGS[currentSceneName];

        let fs = sceneCfgs.fish_sort;
        let sceneFishCfg = {};
        len = fs.length;
        while (len > 0 && len --) {
            let fk = fs[len];
            this._loadFishCfg(fk, sceneFishCfg);
        }

        this._sceneFishCfg = sceneFishCfg;  //当前场景所出鱼种类配置
        this._sceneCfg = clone(sceneCfgs);  //渔场配置
        this._tideDt = 0;//randomInt(this._sceneCfg.tide_circle);   //鱼潮时间检测: 第一个鱼潮时间起点随机
        this._isWarningEscapeNow = false; //鱼潮已经预警标记,即逃跑开始标记
        this._tideCfg = [];
        this._curTideCfg = null;
    }

    //配置鱼的刷新周期
    _loadFishCfg (fk, sceneFishCfg) {
        if (fk && sceneFishCfg && !sceneFishCfg[fk]) {
            let percent = 0;
            let fish = clone(FISH_CFGS[fk]);
            let pp = fish.in_percent;
            let pl = pp.length;
            while (pl > 0 && pl --) {
                percent += pp[pl];
            }
            assertThrow(percent == 100, "鱼的刷新概率配置不等于100");
            
            let arr = fish.in_interval;
            assertThrow(arr && arr.length > 0, "Error, must be an array.");
            fish.in_interval_saved = clone(arr);
            fish.resetInterval = function () {
                let arr = fish.in_interval;
                if (arr.length == 0) {
                    arr = fish.in_interval = clone(fish.in_interval_saved);
                }
                let i = randomInt(arr.length);
                fish.internal = arr[i];  
                arr.splice(i, 1);
            };   
            fish.resetInterval(); 
            fish.dt = 0;//randomInt(fish.internal); //进入场景时，第一条鱼随机时间起点  
            
            sceneFishCfg[fk] = fish;   
            return fish;     
        }
        return null;
    }

    //检测是否有新鱼出现
    checkNewFish (dt) {
        //尽量使用局部变量
        let sceneCfg = this._sceneCfg;
        let sFishCfg = this._sceneFishCfg;
        
        if (!sceneCfg || !sFishCfg) {
            return false;
        }

        //更新生命时间
        this._updateLife(dt);

        //boos未出现时才判定鱼潮，即boss和鱼潮互斥出现
        if (this.canNewBossFish()) {
            //鱼潮进行时
            if (this._tideIng( dt )) {
                return false;
            }

            //鱼潮预警、鱼潮进行时，都不会产生基础路径的鱼
            if (this._checkTide(sceneCfg, dt)) {
                return true;
            }
        }

        this._checkBasePath(sceneCfg, sFishCfg, dt);
        return false;
    }
    
    /**
     * 更新鱼的生命时间，
     * （取消各自定时器，降低开销、增加计时可靠性）
     */
    _updateLife (dt) {
        if (isNaN(dt) || dt == undefined || dt == null) {
            logger.error('roomId = ', this._roomId, ' invalid dt = ', dt);
            dt = 1;
        }

        let fks = [];
        for (let fk in this._actorData) {
            let fish = this._actorData[fk];
            if (fish.isInGroup) {
                continue;
            }
            if (isNaN(fish.floor) || fish.floor == undefined || fish.floor == null || fish.floor <= 0) {
                fks.push(fk);
                continue;
            } 
            fish.lifeDt -= dt;
            if (isNaN(fish.lifeDt) || fish.lifeDt == undefined || fish.lifeDt == null ||  fish.lifeDt <= 0) {
                fks.push(fk);
            }
        }
        let isAll = Object.keys(this._actorData).length === fks.length;
        fks.length > 0 && this._lifeEndEx(fks, isAll);

        //清理死亡历史
        if (!isAll) {
            fks = [];
            for (let fk in this._deadHistory) {
                let ds = this._deadHistory[fk];
                ds.dt -= dt;
                if (isNaN(ds.dt) || ds.dt == undefined || ds.dt == null ||  ds.dt <= 0) {
                    fks.push(fk);
                }
            }
            if (Object.keys(this._deadHistory).length === fks.length) {
                this._clearDeadHistory();
            }else{
                for (let i = 0; i < fks.length; i ++) {
                    let fk = fks[i];
                    delete this._deadHistory[fk];
                }
            }
        }
    }
    

    /**
     * 取[1, n]之间的随机整数,注意是包含首尾
     */
    static _genR1_n (n) {
        let res = Math.ceil(Math.random() * n);
        return res;
    }

    /**随机金币,规则如下,注意是闭区间，收尾都必须包含
     * [100,500]
        形如以上的随机分值：
        若最低分值>=100，则随机时以100为单位进行随机，上面例子的情况下只可能在100,200,300,400,500中随机
        10<=若最低分值<100,随机时以10为单位进行随机
        若最低分值<10，随机时以1为单位进行随机
     */
    static sGenerateFishGold  (fishCfg) {
        let reward = fishCfg.gold_point;
        let res = 0;
        if (reward && reward instanceof Array && reward.length == 2) {
            let min = Math.min(reward[0], reward[1]);
            let max = Math.max(reward[0], reward[1]);
            if (min < 10) {
                res = FishModel._genR1_n(max - min + 1) - 1;
            }else if (min < 100) {
                res = (FishModel._genR1_n((max - min)/10 + 1) - 1) * 10;
            }else{
                res = (FishModel._genR1_n((max - min)/100 + 1) - 1) * 100;
            }
            res += min;
        }else{
            res = reward;
        }
        return res;
    }

    //--创建一条鱼的基本属性,注意数据层和view层的fishKey务必是一样的
    _generateFishData ( fishName, cfg ) {        
        cfg = cfg || this._getFishCfg(fishName);
        let fish = {};
        let actorArray = this._actorData;
        let fishId = cfg.id;
        this._id2Name[fishId] = fishName;

        let nameKey = this.genNameKey(actorArray, fishId);
        fish.nameKey = nameKey;
        fish.goldVal = FishModel.sGenerateFishGold(cfg);
        actorArray[nameKey] = fish;
        this._fishBasePct[nameKey] = cfg.fishbasepct; //将该字段存起来，方便特殊武器打中鱼时对此作出修改等影响

        this._rewardData[nameKey] = {
            floor: 1,
            goldVal: fish.goldVal
        };
        return fish;
    }

    removeActorData ( nameKey ) {
        let fish = this.getActorData(nameKey);
        if (fish && fish.pendants) {
            for (let i = 0; i < fish.pendants.length; i ++) {
                let subFish = fish.pendants[i];
                this.removeActorData(subFish.nameKey);
            }
        }
        if (this._gFish) {
            let subFishes = this._gFish[nameKey];
            if (subFishes) {
                let subKeys = Object.keys(subFishes);
                delete this._gFish[nameKey];
                for (let i = 0; i < subKeys.length; i ++) {
                    let sfk = subKeys[i];
                    this.removeActorData(sfk);
                }
            }else{
                for (let gk in this._gFish) {
                    let gd = this._gFish[gk];
                    if (gd[nameKey]) {
                        delete gd[nameKey];
                        if (Object.keys(gd).length === 0) {
                            this.removeActorData(gk);
                        }
                        break;
                    }
                }
            }
        }
        let goldVal = 0;
        if (fish) {
            let temp = fish.nameKey.split('#');
            let fishID = temp[0];
            let cfg = this.getFishCfgWithID(fishID);
            if (cfg && cfg.display_type == 3) {
                if (this._curBoosCount > 0) {
                    this._curBoosCount --;
                }
                this._emitEvent(FishModel.EventType.EVENT_BOSS_OVER);
            }
            goldVal = fish.goldVal;
        }
        
        delete this._actorData[nameKey];
        delete this._fishBasePct[nameKey];
        delete this._rewardData[nameKey];

        this._setDead2History(nameKey, goldVal);
        DEBUG && logger.error('roomId = ', this._roomId, ' del = nameKey = ', nameKey, this.getActorTotal());
    }

    //标记已死亡的鱼 0无 >0 则为死亡时该鱼的分值
    _setDead2History (fishKey, flag) {
        this._deadHistory[fishKey] = {
            flag: flag,
            dt: 3, //过期时间后，删除这个对象
        };
    }

    //清空鱼的死亡历史
    _clearDeadHistory () {
        this._deadHistory = {};
    }

    //查找该鱼是否在历史上死亡过
    findDeadHistory (fishKey, isCleanNow) {
        let val = 0;
        if (this._deadHistory[fishKey]) {
            val = this._deadHistory[fishKey].flag;
            isCleanNow && (delete this._deadHistory[fishKey]);
        }
        return val;
    }

    //更新鱼的生命状态
    updateLifeState (fishKey, floor) {
        let fish = this.getActorData(fishKey);
        if (fish) {
            if (floor === 0) {
                this.removeActorData(fishKey);
            }else if (floor > 0){
                fish.floor = floor;
            }
        }
    }

    //广播到房间内所有玩家
    _emitEvent (evtName, evtData) {
        this._evtor.emit(consts.FLUSH_EVENT, evtName, evtData);
    }

    //鱼潮是否正在进行
    isTideIng () {
        return this._isWarningEscapeNow || this._curTideCfg != null;
    }

    //鱼潮进行时
    _tideIng ( dt ) {
        let data = this._curTideCfg;
        if (!this._isWarningEscapeNow && data) {
            this._tideDt += dt;
            if (this._tideDt >= data.during) {
                this._tideDt = 0;
                this._curTideCfg = null;
                DEBUG && logger.warn('roomId = ', this._roomId, " TODO: 鱼潮时间到，清空当前鱼//---");
                this._emitEvent(FishModel.EventType.EVENT_TIDE_OVER);
                return false;
            }
            

            //注意：从后向前遍历，尽量减少因删除带来的移动次数
            let waves = data.wave_group;
            let len = waves.length;
            //logger.warn("len = ", len, this._tideDt, data.during, this._tideDt >= data.during );
            while(len && len --) {
                let w = waves[len];
                if (this._tideDt >= w.start) {
                    w.dt += dt;
                    if (w.dt >= w.internal) {
                        let fishKey = w.fish;
                        if (w.count_type == 0) {
                            let waveName =  fishKey;
                            fishKey = waveName.replace('.', '_');
                            this._newGroupFish(fishKey, function(dt) {
                                let actDt = dt + w.count*w.internal + w.start;
                                if (actDt > data.during) {
                                    data.during = actDt;
                                }
                            }, waveName, w.path);
                        }else{
                            this._newFishWithPath(fishKey, w.path, function (dt) {
                                //注意：此处动态调整鱼潮持续时间 = 路径持续时间 + 最后一条鱼的延迟时间 + 当前路径延迟出现时间
                                let actDt = dt + w.count*w.internal + w.start;
                                if (actDt > data.during) {
                                    data.during = actDt;
                                }
                            });
                        }
                        w.dt = 0;
                        w.count -= 1;
                        if (w.count <= 0) {
                            waves.splice(len, 1);
                        }
                    }
                }
            }
            return true;
        }
        return false;
    }

     //随机取出一个tide,相邻两个tide不重复
     _generateRandomTide () {
        let len = this._tideCfg.length;
        if (len == 0) {
            //越南版，排除捕捞季鱼阵，含有中文
            this._tideCfg = [];
            if (versions.PUB === versions.GAMEPLAY.VIETNAM) {
                for (let i = 0; i < TIDE_CFGS.length; i ++) {
                    let tide = TIDE_CFGS[i];
                    if (tide.id === 1001) {
                        continue;
                    }
                    this._tideCfg.push(clone(tide));
                }
            }else{
                this._tideCfg = clone(TIDE_CFGS);
            }
            len = this._tideCfg.length;
        }
        let idx = randomInt(len);
        let data = this._tideCfg[idx];
        this._curTideCfg = data;
        this._tideCfg.splice(idx, 1);
     }

    //鱼潮检测,和基本路径不重叠
    _checkTide ( sceneCfg, dt ) {
        //鱼潮周期小于等于0则视为不出现鱼潮
        if (sceneCfg.tide_circle <= 0) {
            return false;
        }
        this._tideDt += dt;
        let warningDt = sceneCfg.tide_circle - sceneCfg.tide_warning;
        let isWarningTiped = this._isWarningEscapeNow;
        if (this._tideDt >= sceneCfg.tide_circle) {
            this._isWarningEscapeNow = false;
            this._tideDt = 0;
            this._clearDeadHistory();
            return true;
        }else if (!isWarningTiped && this._tideDt >= warningDt) {
            this._generateRandomTide();
            this._isWarningEscapeNow = true;
            this._escapeAll({escape_dt : sceneCfg.tide_warning, tideIcon: this._curTideCfg.pic, bgm: this._curTideCfg.bgm});
            return true;
        }
        
        return isWarningTiped;
    }

    //检测生成鱼
    _checkOneFish (dt, sFishCfg, isGuideFish) {
        if (!sFishCfg) {
            return;
        }
        for (let fk in sFishCfg) {
            let fh = sFishCfg[fk];
            fh.dt += dt;
            // 判定鱼能否刷新
            if (fh.dt >= fh.internal) { 
                fh.resetInterval();
                fh.dt = 0;
                if (fh.count_type == 0) {
                    this._newGroupFish(fk);
                }else{
                    this._newFish(fk, isGuideFish);
                }
            }
        }
    }

    //基本路径检测,和鱼潮不重叠
    _checkBasePath ( sceneCfg, sFishCfg, dt ) {
        let fishTotal = this.getActorTotal();
        if (fishTotal >= sceneCfg.total) {
            DEBUG && logger.warn('roomId = ', this._roomId, "--reach to top = ", sceneCfg.total, fishTotal);
            return;
        }

        this._checkOneFish(dt, sFishCfg);
    }

    //自然死亡，即时间到
    _lifeEnd (fish) {
        this.removeActorData(fish.nameKey);
        this._emitEvent(FishModel.EventType.EVENT_DEAD_LIFE_END, {
            fishKeys : [fish.nameKey], 
        });
    }

    //批量自然死亡
    _lifeEndEx (fishKeys, isAll) {
        let data = {
            fishKeys: fishKeys, 
        };
        if (isAll) {
            data.fishKeys = ['-1'];//全部死亡
            this._clearDeadHistory();
        }
        this._emitEvent(FishModel.EventType.EVENT_DEAD_LIFE_END, data);
        for (let i = 0; i < fishKeys.length; i ++) {
            let nameKey = fishKeys[i];
            this.removeActorData(nameKey);
        }
    }

    //鱼阵鱼，从配置中选择路径
    _newGroupFish ( groupFishKey, func, waveName, pName, isGuideFish ) {
        isGuideFish = isGuideFish || false;
        let cfg = this._getFishCfg(groupFishKey);
        let groupFish = this._generateFishData(groupFishKey, cfg);
        if (!waveName) {
            waveName = groupFishKey.replace('_json', '.json');
        }
        let subFishKeys = {};
        let data = _getPathCfg(waveName);
        let fishes = data.fishes;
        let pathName = this._selectPath(cfg, pName);
        let pathData = _getPathCfg(pathName);
        let sub_fish = 0;
        fishes.sort(function (a, b) {
            return a.pos.x > b.pos.x ? 1 : -1;
        });
        fishes.sort(function (a, b) {
            return a.pos.y > b.pos.y ? 1 : -1;
        });

        let len = fishes.length;
        let subKeys = [];
        for (let i = 0; i < len; i ++) {
            let v = fishes[i];
            let fish = this._generateFishData(v.fishKey);
            fish.isInGroup = true;
            subFishKeys[fish.nameKey] = 1;
            this._resetRewardParams(fish);

            if (i === 0) {
                let temp = fish.nameKey.split('#');
                let idx = parseInt(temp[1]);
                sub_fish = idx;
            }
            subKeys.push(fish.nameKey);
        }
        if (!this._gFish) {
            this._gFish = {};
        }
        this._gFish[groupFish.nameKey] = subFishKeys;

        DEBUG && logger.warn('roomId = ', this._roomId, " pathName = ", pathName, groupFishKey);
        let dt = genDtBySpeed(pathData, cfg.move_speed) + LIFE_OFFSET;
        groupFish.lifeDt = dt;
        groupFish.path = pathName;
        groupFish.sub_fish = sub_fish, 
        this._curTideCfg && (groupFish.tide = this._curTideCfg.id);

        //鱼潮鱼阵音效配置
        this._newFishEvent(groupFish, FishModel.EventType.EVENT_NEW_GROUP_FISH);
        if (func) {
            func(dt, subKeys);
        }

        return groupFish;
    }

    //单鱼，从配置中选择路径
    _newFish ( fishKey, isGuideFish, pathName) {
        //fishKey = 'denglongyu_boss_1'//'haima_boss_1'//'zhangyu_boss_3'//'meirenyu_boss_2'//"dianman_2"//"denglongyu_boss_1"//"haitun1" //test 
        //_debugTest ++;
        // if (_debugTest > 1) {
        //     return;
        // }
        // if (_debugTest > 20) {
        //     _debugTest = 0;
        //     fishKey = 'dianman';
        // }
        // fishKey = 'shuimu'; //
        isGuideFish = isGuideFish || false;
        let cfg = this._getFishCfg(fishKey);
        let fish = this._generateFishData(fishKey, cfg);
        //fish.attribute = clone(FishAttribute);

        pathName = pathName || this._selectPath(cfg);
        let pdData = _getPathCfg(pathName);
        let singleFish = fish;
        let isBoss = cfg.display_type === 3; //boss类型
        if (isBoss) {
            if (!this.canNewBossFish()) {
                DEBUG && logger.warn('roomId = ', this._roomId, " 当前boss还在，不能同时出现两个boss！");
                return;
            }
            this._curBoosCount ++;
        }
        let dt = genDtBySpeed(pdData, cfg.move_speed) + LIFE_OFFSET;
        singleFish.lifeDt = dt;
        singleFish.path = pathName;
        this._newFishEvent(singleFish);
        return fish;//只是返回数据，ui可能有可能没用
    }

    canNewBossFish  () {
        return this._curBoosCount < 1;
    }

    //刷鱼事件，统一处理，方便附带回调处理
    _newFishEvent (customData, evtName) {
        evtName = evtName || FishModel.EventType.EVENT_NEW_FISH;
        let temp = clone(customData);
        let fish = temp;
        fish.path && (fish.path = fish.path.replace('.json', ''));
        this._emitEvent(evtName, {data: temp});
        fish = customData;
        fish._lifeDtSaved = fish.lifeDt;
        this._resetRewardParams(fish);

    }

    //重置得分、生命层级等参数，这些参数无需发给客户端
    _resetRewardParams (fish) {
        if (!fish) return;
        let rd = this._rewardData[fish.nameKey];
        if (rd) {
            fish.floor = rd.floor; //相当于几条命
            fish.goldVal = rd.goldVal;
            delete this._rewardData[fish.nameKey];
        }
    }

    //单鱼，指定路径
    _newFishWithPath ( fishKey, pathKey, func ) {
        let cfg = this._getFishCfg(fishKey);
        let fish = this._generateFishData(fishKey, cfg);
        //fish.attribute = clone(FishAttribute);
        let pd = PATH_CFGS[pathKey];
        let pName = pd && pd.name_list || pathKey;
        let pathData = _getPathCfg(pName);
        let dt = genDtBySpeed(pathData, cfg.move_speed);
        if (func) {
            func(dt);
        }
        fish.lifeDt = dt;
        fish.path = pName;
        this._newFishEvent(fish);
    }

    /**
     * 通过技能召唤特殊鱼
     */
    callAnSpecialFish (fishKey, pathName) {
        this._newFish(fishKey, false, pathName);
    }

    //或者直接改变值吧
    changeAttribute  (nameKey,  key, value) {
        let fish = this.getActorData(nameKey);
        fish.attribute[key] = value;
    }

    /**
     * 所有鱼因为鱼潮而逃跑
     */
    _escapeAll (params) {
        let dt = params.escape_dt;
        let self = this;
        for (var k in this._actorData) {
            let fish = this._actorData[k];
            if (fish.lifeDt > 0) {
                (!dt) && logger.error('->error: _escapeAll = ', dt, params);
                fish.lifeDt = dt;
            }
        }
        this._emitEvent(FishModel.EventType.EVENT_ESCAPE_NOW, params);
    }


    /**
     * 随机找出分值较大的鱼
     */
    findMaxValueFish () {
        let value = [];
        for (let fk in this._actorData) {
            let fish = this._actorData[fk];
            value.push({
                fk: fk,
                gold: fish.goldVal
            });
        }
        value.sort(function (a, b) {
            return a.gold > b.gold ? -1 : 1;
        });
        let length = value.length;
        if (length > 0) {
            let ri = 0;
            let half = 3;//Math.floor(length/2);
            if (length > half) {
                ri = Math.floor(Math.random() * half);
            }
            return value[ri].fk;
        }
        return null;
    }

    /**
     * 查找某鱼是否存在
     */
    findFish (fishKey) {
        return this._actorData && this._actorData[fishKey];
    }
    
    /**
     * 重置鱼相关参数
     * 价值、基础捕获率
     */
    resetFish (fishKey, effectvalue) {
        let fish = this._actorData[fishKey];
        let oldFishBasePct = this._fishBasePct[fishKey];
        if (fish && oldFishBasePct) {
            let oldGoldVal = fish.goldVal;
            fish.goldVal -= effectvalue;
            if (fish.goldVal < 1) {
                fish.goldVal = 1;
            }
            this._fishBasePct[fishKey] = oldFishBasePct * oldGoldVal / fish.goldVal;
        }
    }

    getFishBasePct (fishKey) {
        return this._fishBasePct[fishKey] || 1;
    }    

}


FishModel.EventType = {
    EVENT_NEW_FISH      :"S_FISH",			//新刷出一条单鱼
    EVENT_CLEAR_ALL     :"C_ALL",         //清除当前屏幕所有鱼
    EVENT_ESCAPE_NOW    :"E_NOW",        //鱼潮来领,立即逃离
    EVENT_NEW_GROUP_FISH :"G_FISH",     //刷出组合鱼，鱼阵
    EVENT_BOSS_COMMING  : "B_COMMING",     //boss 来袭
    EVENT_BOSS_OVER  : "B_OVER",     //当前所有boss已离开或死亡
    EVENT_TIDE_OVER : "T_OVER",  //鱼潮结束
    EVENT_CREATE_PENDANT: "C_PENDANT", //挂件鱼生成
    EVENT_CAST_SKILL : "C_SKILL", //鱼施放技能
    EVENT_DEAD_LIFE_END :"L_END",              //鱼自然死亡，即游动到终点
};

FishModel.SkillIdx = {
    SK_LIGHTING:1,  //闪电技能，触发技能     
    SK_BOOM:2,  //爆炸技能，触发技能     
    SK_BLACKHOLE:3, //黑洞技能 
    CHONGCI : 4, //冲刺
    ZHAOHUANPEN : 5, //召唤挂件
    JIANSU : 6	, //减速
    SHANBI : 7 , //闪避
    FANTAN : 8, //反弹
    TOUQUGOLD : 9, //偷取金币
    SONGGOLD : 10 , //送金币
    ZHAOHUANFISH : 11 , //召唤鱼  
};

module.exports = FishModel;