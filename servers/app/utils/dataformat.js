
//对象转map
module.exports.objToMap = function objToStrMap(obj) {
    let strMap = new Map();
    for (let k of Object.keys(obj)) {
        strMap.set(k, obj[k]);
    }
    return strMap;
};

//map转对象
module.exports.mapToObj = function(strMap) {
    let obj = Object.create(null);
    for (let [k,v] of strMap) {
        obj[k] = v;
    }
    return obj;
};


// 并集
// let unionSet = new Set([...a, ...b]);
//[1,2,3,5]

// 交集
// let intersectionSet = new Set([...a].filter(x => b.has(x)));
// [2,3]

// ab差集
// let differenceABSet = new Set([...a].filter(x => !b.has(x)));
// [1]