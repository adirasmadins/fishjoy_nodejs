const RANK_TYPE = {
    // Current
    ALL : -1,
    GOLD: 0,
    ACHIEVE: 1,  //成就点排行榜
    MATCH: 2,   //排位赛排行榜
    RANKING: 2,
    GODDESS: 3,  //保卫女神排行榜
    AQUARIUM: 4,  //水族馆排行榜
    PETFISH: 4,
    CHARM : 5,  //魅力值排行榜
    BP : 6,    //捕鱼积分排行榜
    FLOWER : 7,  //鲜花排行榜

    // YD: Yesterday(10*)
    GOLD_YD: 100,
    ACHIEVE_YD: 101,
    MATCH_YD: 102,
    GODDESS_YD: 103,
    AQUARIUM_YD: 104,
    CHARM_YD : 105,
    BP_YD : 106,
    FLOWER_YD : 107,

    // LW: Last Week(100*)
    GODDESS_LW: 1003,

    // YD: Last Month(1000*)
    MATCH_LM: 10002,
};

module.exports = {
    RANK_TYPE:RANK_TYPE,
    rank:{
        time: '*/10,*,*,*,*,*',
        sub:[
            {redis_key:"rank:goddess:result",type:RANK_TYPE.GODDESS},
            {redis_key:"rank:match:result",type:RANK_TYPE.MATCH},
            {redis_key:"rank:aquarium:result",type:RANK_TYPE.AQUARIUM},
            {redis_key:"rank:charm:result",type:RANK_TYPE.CHARM},
            {redis_key:"rank:bp:result",type:RANK_TYPE.BP},
            {redis_key:"rank:flower:result",type:RANK_TYPE.FLOWER},
        ]
    }
};