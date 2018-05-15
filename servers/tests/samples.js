
class People{
    constructor(){
        this._map = new Map();
        // this.init();

    }

    init(){
        console.log(1);
        throw Error('big test');
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
        let obj = {};
        try {
            this.init();
        }catch (e) {
            obj.stack = '' + e.stack;
            console.log('e=',e);
        }
        console.log('obj=',obj.stack);
    }
}

let p = new People1();
p.print();



return;

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
