var myhttp = require("http");
var myexpress = require("./server/node_modules/express");
var mypath = require("path");
//var userDao = require("./server/dao/userdao.js");
var app = myexpress();
app.set("port",8888);
app.configure(function(){
//    app.use(myexpress.cookieParser());// 文件名
//    app.use(myexpress.session({secret: "mrj" }));//键名
    app.use(myexpress.logger("dev"));
    app.use(myexpress.bodyParser());
    app.use(myexpress.methodOverride());
    app.use(app.router);
    app.use(myexpress.static(__dirname,"client"));
    app.use(myexpress.static(mypath.join(__dirname,"client")));
    app.use(myexpress.favicon());//设置favicon
    app.use(myexpress.errorHandler());
});
var myserver = myhttp.createServer(app);
myserver.listen(app.get("port"));

