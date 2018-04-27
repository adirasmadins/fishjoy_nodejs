module.exports =
{
	"100" : {
		name : "运营用",    //--角色名
		desc : "运营用",    //--说明
		auth : [100,201,301],    //--权限
		sidebar : 'index.operation'
	},
	"101" : {
		name : "策划用",    //--角色名
		desc : "策划用",    //--说明
		auth : [100,201,301],    //--权限
		sidebar : 'index.design'
	},
	"102" : {
		name : "测试用",    //--角色名
		desc : "测试用",    //--说明
		auth : [100,201,301],    //--权限
		sidebar : 'index.test'
	},
	"2" : {
		name : "超级管理员",    //--角色名
		desc : "超级管理员专用",    //--说明
		auth : [100,201,301],    //--权限
		sidebar : 'index.superadmin'
	},
};