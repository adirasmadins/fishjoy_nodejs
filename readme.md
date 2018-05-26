<img src="http://image.baidu.com/search/detail?z=0&word=%E4%BA%91%E6%BC%AB%E4%BD%9C%E5%93%81&hs=0&pn=0&spn=0&di=0&pi=43552798411&tn=baiduimagedetail&is=0%2C0&ie=utf-8&oe=utf-8&cs=730569360%2C1433074384&os=&simid=&adpicid=0&lpn=0&fm=&sme=&cg=&bdtype=-1&oriquery=&objurl=http%3A%2F%2Fd.hiphotos.baidu.com%2Fimage%2Fpic%2Fitem%2Fbba1cd11728b471072e43adfc9cec3fdfd0323de.jpg&fromurl=&gsm=0&catename=pcindexhot" alt="fishjoy framework for nodejs" width="100px" height="50" />fishjoy V3版本基于V2进行一次技术升级，在升级过程中，会引入一些新模块、新技术，为方便开发人员开发新项目能够快速迁移过来，把V3版本从开发环境到部署运行设计到的相关内容，整理成文，供使用者参考

# 项目优化

- 对外业务模块接口优化，变更为通过EventId 进行事件分发，模块化内部业务实现
- 业务错误码模板定义
- 利用es6新特性，完成部分模块的迁移升级
- 大厅单节点负载问题
- 平台性能测试工具``````````
- omelo客户端JS驱动更新
- cocos creator引入
- omelo start -e production --daemon
- apt install sysstat
- npm install -g supervisor

# 性能优化

node --prof app.js

node --prof-process isolate-000000000043B880-v8.log > processed.txt


# node升级到v8.9.0 Latest LTS: Carbon

- ## linux
- 安装NVM: curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.2/install.sh | bash
- 安装NODE: nvm install v8.9.0

- ## 包管理工具使用cnpm
- 优势：资源位于淘宝镜像服务器，同官方保持10分钟同步一次。
- 安装：npm install -g cnpm --registry=https://registry.npm.taobao.org
- 使用：同npm一样，仅命令采用cnpm即可

# web 采用基于egg框架
- ## 概述
	基于koa的框架，支持es新特性，回调噩梦
- ## 部署
	npm i egg-init -g
	生成koa项目： egg-init egg-example --type=simple
	启动项目:npm run dev 完成启动
	mysql -h10.66.204.213 -uroot -pCh123456

- ## 开发
	参考：
``` 
http://www.jianshu.com/p/6b816c609669
http://koajs.com/#introduction
https://github.com/guo-yu/koa-guide
http://eggjs.org/zh-cn/intro/index.html
```
# koa项目
	## 安装 
		npm install -g koa-generator 
	## 生成
		koa2 koa_demo -e --ejs 


# 开发工具

- ## webstorm

- ## visual studio code

### 插件

- ## curl

```

curl -l -H "Content-type: application/json" -X POST -d '{"aes":false,"data":{"token":"3747_03458cd087cb11e7ba758392291a4bfa","payChannel":1003,"payData":{"cardCode":"93474901263928","cardSerial":"36330400022121","cardType":"vnp"}}}'  "http://171.244.35.45:1338/client_api/get_api_server"
```

```
Git History:提交历史及版本对比
ESLint: 代码检测
Chrome DevTools Protocol: 前端代码调试 
```

# 调试工具

## node-inspector

## visual studio code

# 代码检测

## 安装

- ## 全局安装依赖

- 安装eslint 工具：npm i eslint -g
- 执行命令：eslint ./ --ext .js
- 自动修复：eslint --fix ./ --ext .js

```eslint-config-standard
eslint-plugin-import
eslint-plugin-node
eslint-plugin-promise
eslint-plugin-standard
eslint-plugin-promise
```

- ## 维护指令
- 文件内容搜索 find . -name 'fjs-out-0.log' -exec grep -in 'pay response:' {} \; -print
- 服务进程列表：omelo list
- 关闭进程：omelo kill all
- 强制关闭所有node进程：pkill node
- 后台启动生成环境：omelo start -e production -D
- 后台启动开发环境：omelo start -D
- 重启进程：omelo restart -i 服务ID

- ## 浏览器调试
- 空间地址: https://wiki.qzone.qq.com/debug/index.html
- APP ID: 1105938023
- 浏览器console:OPEN_DATA找到openkey=F410B5E021940465ED1BACB67E1C5D00
- 赋值：common.App.getSdk()._openkey='F410B5E021940465ED1BACB67E1C5D00'

- common.App.getSdk()._openkey=OPEN_DATA.appurl.substring(OPEN_DATA.appurl.search("openkey=")+8,OPEN_DATA.appurl.search("&platform"))


- ## mocha 测试
- mocha --reporters:参数可以显示所有内置的报告格式
- mocha –R :用来指定报告的格式：spec、tap
- mocha –t :测试用例中有一个异步执行过程，需要调高mocha的单元测试时间
- mocha –watch :参数用来监视指定的测试脚本。只要测试脚本有变化
- mocha –bail：参数指定只要有一个测试用例没有通过，就停止执行后面的测试用例
- mocha –grep：参数用来搜索单元测试用例的名称,然后运行符合搜索条件的测试用例,支持正则表达
- mocha --recursive:执行目录下所有的测试用例

// 提交检出均不转换
git config --global core.autocrlf false

- ## mysql 备份恢复
- mysqldump -u root -p -d fishjoy > fishjoy_struct.sql
- mysqldump -u root -p -t fishjoy tbl_account> fishjoy_data.sql
- npm install --production
- zip -r node_modules_prod.zip node_modules/

// git submodule 参考:https://blog.csdn.net/wwj_748/article/details/73991862
- git submodule add https://github.com/linyngfly/fishjoy_design_config.git design_cfg
- git add .getmodules design_cfg
- git commit -m "add design_cfg submodule."
- git submodule init
- git submodule update
// 提交submodule的内容到远程:
- cd design_cfg
- git add .
- git commit -m "嵌入React Native"
- git push

//提交主工程的变更
git add .
git commit -m "update android submodule"
git push

更新Submodule

- git submodule foreach git pull origin master
- cd design_cfg
- git pull

## 发布
- 修改版本号(versions.js)
DEVELOPMENT: false
PUB: GAMEPLAY.VIETNAM_VN_TEST
- 执行发布文件
cd /fishjoy_server3.1/tools/pack/
gulp
- 登录到主机
cd /opt/auto_deploy
./publish.sh
./restart.sh

## mysql 远程连接授权
- grant all privileges  on *.* to root@'%' identified by "root";

- SELECT * from tbl_item_log WHERE scene IN(31) AND log_at>='2018-05-16 00:00:00' AND log_at<='2018-05-16 23:59:59' into outfile /tmp/item_log.csv
- mysql -h 103.90.220.76 -P 3030 -umysqlremote -pVnet@9999 --database=fishjoy --execute="SELECT * from tbl_item_log WHERE scene IN(31) AND log_at>='2018-05-16 00:00:00' AND log_at<='2018-05-16 23:59:59'" -X > /tmp/item_log.csv





