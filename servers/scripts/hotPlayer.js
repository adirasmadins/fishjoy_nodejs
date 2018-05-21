class Player{
    constructor(){
        this._name = 'linyng';
        this._age = 100;
    }

    set name(value){
        this._name =value;
    }

    go(){
        console.log('Player _name=', this._name);
        console.log('Player _age=', this._age);
    }

    go1(){
        console.log('Player _name=', this._name);
        console.log('Player _age=', this._age);
    }
}

class APlayer extends Player{
    constructor(){
        super();
        this._Aname = 'Alinyng';
        this._Aage = 1100;
    }

    static attach(instObj){
        let o = Object.getOwnPropertyNames(APlayer.prototype);
        for(let i in o) {
            console.log('attach:',o[i]);
           let key = o[i];
           if(key != 'constructor'){
            instObj[key] = APlayer.prototype[key];
           }

        }
    }

    static dettach(instObj, prototypeObj){
        console.log('instObj 111=', instObj._name);
        let o1 = Object.getOwnPropertyNames(APlayer.prototype);
        for(let i in o1) {
            console.log('delete',o1[i]);
           let key = o1[i];
           if(key != 'constructor'){
            delete instObj[key];
           }
        }
        console.log('instObj 222=', instObj._name);
        let o = Object.getOwnPropertyNames(prototypeObj);
        for(let i in o) {
            console.log('revover=',o[i]);
           let key = o[i];
           if(key != 'constructor' && typeof prototypeObj[key] == 'function'){
            instObj[key] = prototypeObj[key];
           }

        }
    }

    go(){
        console.log('APlayer _name=', this._name);
        console.log('logAPlayer _age=', this._age);
        console.log('APlayer _Aname=', this._Aname);
        console.log('APlayer _Aage=', this._Aage);
    }

    walk(){
        console.log('APlayer call walk');       
         console.log('APlayer _Aname=', this._Aname);

        console.log('APlayer _name=', this._name);
    }
}


let p1 = new Player();
// p1.go();
p1.name = "modify name";
// p1.go();
console.log('=======================================================================');

APlayer.attach(p1, APlayer.prototype);

p1._Aname = 'haha';
p1._Aage = 120;
p1.walk();
p1.go();

console.log('=======================================================================');
APlayer.dettach(p1, Player.prototype);
// p1.walk();
p1.go();


// for(let key in Player){
//     console.log('key=========', key);
//     if(typeof p2[key] == 'function'){
//         p1[key] = p2[key];
//         console.log('key=========', key);
//     }
// }
// p1.walk();