
const fs = require('fs');
console.log(__filename)
let filename = __filename;

const WHITE_LIST = [4,27,63,38,123,124,31,13,35,118,28,122,21,30,31,50,51,109,110,111,112,113,114,115,116,117];
console.log(WHITE_LIST.indexOf(0))
return;

class People{
    constructor(){
        this._map = new Map();
        // this.init();

    }

    init(){
        console.log(1);
        for(let k in People.TypeDef){
            this._map.set(k, People.TypeDef[k]);
        }
    }
}

People.TypeDef = {
    0:100,
    1:200
};

class People1 extends  People{
    print(){
        console.log(2);
        this.init();
    }
}



let p = new People1();
p.print();

const tests = module.exports;
tests.add = (a, b) => {
    return a + b;
}

tests.compareValue = (a, b) => {
    return a > b;
}

tests.getObj = (name, age) => {
    return {
        name: name,
        age: age
    };
}

tests.read = (cb) => {
    setTimeout(function() {
        fs.readFile('./test/samples.js', 'utf-8', (err, result) => {
            if (err) return cb(err);
            // console.log("result",result);
            cb(null, result);
        }) 
    }, 3000);
}
