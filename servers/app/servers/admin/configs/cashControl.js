const REDISKEY = require('../../../models/index').REDISKEY;
module.exports = [
	{
		key : 100,    //--ID
		type : 2,    //--类型1值2选项
		value : 1,    //--参数值
		desc : "提现开关",    //--描述
		redis : REDISKEY.SWITCH.CIK,    //--redis
	},
	{
		key : 101,    //--ID
		type : 1,    //--类型1值2选项
		value : 5,    //--参数值
		desc : "每个用户每天最大提现次数",    //--描述
		redis : "cash:require:maxTimes",    //--redis
	},
	{
		key : 102,    //--ID
		type : 1,    //--类型1值2选项
		value : 7500000,    //--参数值
		desc : "每个用户每天最大提现数量",    //--描述
		redis : "cash:require:maxCash",    //--redis
	},
	{
		key : 103,    //--ID
		type : 1,    //--类型1值2选项
		value : 5,    //--参数值
		desc : "前3次每次提现间隔",    //--描述
		redis : "cash:require:interval",    //--redis
	},
	{
		key : 104,    //--ID
		type : 1,    //--类型1值2选项
		value : 30,    //--参数值
		desc : "3次以后每次提现间隔",    //--描述
		redis : "cash:require:interval3",    //--redis
	},
	{
		key : 105,    //--ID
		type : 1,    //--类型1值2选项
		value : 35000,    //--参数值
		desc : "玩家提现后最低剩余金币",    //--描述
		redis : "cash:require:minSurplus",    //--redis
	},
	{
		key : 106,    //--ID
		type : 2,    //--类型1值2选项
		value : 1,    //--参数值
		desc : "Viettel预付卡20000是否自动",    //--描述
		redis : "cash:require:automaticVT20000",    //--redis
	},
	{
		key : 107,    //--ID
		type : 2,    //--类型1值2选项
		value : 1,    //--参数值
		desc : "Viettel预付卡50000是否自动",    //--描述
		redis : "cash:require:automaticVT50000",    //--redis
	},
	{
		key : 108,    //--ID
		type : 2,    //--类型1值2选项
		value : 1,    //--参数值
		desc : "Viettel预付卡100000是否自动",    //--描述
		redis : "cash:require:automaticVT100000",    //--redis
	},
	{
		key : 109,    //--ID
		type : 2,    //--类型1值2选项
		value : 1,    //--参数值
		desc : "Viettel预付卡200000是否自动",    //--描述
		redis : "cash:require:automaticVT200000",    //--redis
	},
	{
		key : 110,    //--ID
		type : 2,    //--类型1值2选项
		value : 1,    //--参数值
		desc : "Viettel预付卡500000是否自动",    //--描述
		redis : "cash:require:automaticVT500000",    //--redis
	},
	{
		key : 111,    //--ID
		type : 2,    //--类型1值2选项
		value : 1,    //--参数值
		desc : "Vinaphone预付卡20000是否自动",    //--描述
		redis : "cash:require:automaticVF20000",    //--redis
	},
	{
		key : 112,    //--ID
		type : 2,    //--类型1值2选项
		value : 1,    //--参数值
		desc : "Vinaphone预付卡50000是否自动",    //--描述
		redis : "cash:require:automaticVF50000",    //--redis
	},
	{
		key : 113,    //--ID
		type : 2,    //--类型1值2选项
		value : 1,    //--参数值
		desc : "Vinaphone预付卡100000是否自动",    //--描述
		redis : "cash:require:automaticVF100000",    //--redis
	},
	{
		key : 114,    //--ID
		type : 2,    //--类型1值2选项
		value : 1,    //--参数值
		desc : "Vinaphone预付卡200000是否自动",    //--描述
		redis : "cash:require:automaticVF200000",    //--redis
	},
	{
		key : 115,    //--ID
		type : 2,    //--类型1值2选项
		value : 1,    //--参数值
		desc : "Vinaphone预付卡500000是否自动",    //--描述
		redis : "cash:require:automaticVF500000",    //--redis
	},
	{
		key : 116,    //--ID
		type : 2,    //--类型1值2选项
		value : 1,    //--参数值
		desc : "Mobifone预付卡20000是否自动",    //--描述
		redis : "cash:require:automaticMF20000",    //--redis
	},
	{
		key : 117,    //--ID
		type : 2,    //--类型1值2选项
		value : 1,    //--参数值
		desc : "Mobifone预付卡50000是否自动",    //--描述
		redis : "cash:require:automaticMF50000",    //--redis
	},
	{
		key : 118,    //--ID
		type : 2,    //--类型1值2选项
		value : 1,    //--参数值
		desc : "Mobifone预付卡100000是否自动",    //--描述
		redis : "cash:require:automaticMF100000",    //--redis
	},
	{
		key : 119,    //--ID
		type : 2,    //--类型1值2选项
		value : 1,    //--参数值
		desc : "Mobifone预付卡200000是否自动",    //--描述
		redis : "cash:require:automaticMF200000",    //--redis
	},
	{
		key : 120,    //--ID
		type : 2,    //--类型1值2选项
		value : 1,    //--参数值
		desc : "Mobifone预付卡500000是否自动",    //--描述
		redis : "cash:require:automaticMF500000",    //--redis
	},
];