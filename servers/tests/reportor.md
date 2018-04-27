# TOC
   - [mocha sampele1](#mocha-sampele1)
   - [mocha sampele2](#mocha-sampele2)
   - [http test samples3](#http-test-samples3)
<a name=""></a>
 
<a name="mocha-sampele1"></a>
# mocha sampele1
boolean.

```js
expect(samples.compareValue(2,1)).to.be.ok;
expect(samples.compareValue(1,8)).to.not.be.ok;
```

<a name="mocha-sampele2"></a>
# mocha sampele2
<a name="http-test-samples3"></a>
# http test samples3
get baidu info.

```js
request('https://www.baidu.com')
.get('/')
.expect(200)
.expect('Content-Type', /html/)
.end((err, res)=>{
    // console.log(res.text);
    expect(res).to.be.an('object');
    done();
});
```

