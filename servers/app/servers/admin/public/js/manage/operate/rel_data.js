// 接口
var actions = {
	'queryJackpot':'/admin/queryJackpot',
	'getCashData':'/admin/getCashData',
	'period':'/admin/queryServerPeriod',
	'profit':'/admin/getProfitChart',
	'queryPlayer':'/admin/queryPlayer',
	'changeCatchRate':'/admin/changeCatchRate',
	'changeQueryServerPeriod':'/admin/changeQueryServerPeriod',
	'getScene':'/admin/getSceneCatchRateList',
	'editScene':'/admin/modifySceneCatchRate',
	'listnum':20,
	'profit_num':100
}
// 回调
var callback = {
	get_list:function(data,p,obj){
		var tem = obj.attr('data-box');
		console.log(tem);
		pagination(p.start?p.start : 1,data.data.pages,data.data.rows,obj.parents('.tablebox').next('div').find('ul.pagination'));
		obj.html(template(tem, data));
	},
	eidts:function(data){
		console.log(data);
		if(data.data.value || data.data.rate){
			if(data.rang == 'yes'){
				console.log(data.data.value)
				if(data.data.value >=0.5 && data.data.value <=1.5){
					events.$ajax(data.url,data.data,callback.call_eidt,'',data);
				}else{
					events.myalert(namebox.rangtip);
				}
			}else{
				events.$ajax(data.url,data.data,callback.call_eidt,'',data);
			}
		}else{
			events.myalert(namebox.filltip);
		}
		
	},
	call_eidt:function(data,p,box){
		if(data.data.result == true){
			events.myalert(namebox.succ);
			if(box.changenum == 1){
				box.obj.parents('tr').find('.eidt-input').val(box.data.value);
				box.obj.parents('tr').find('.val-show').html(box.data.value);
			}else{
				var mainbox = box.obj.parents('.edit-mainbox');
				mainbox.find('.rateinput').val(box.data.rate);
				mainbox.find('.timeinput').val(box.data.leftSecond);
				mainbox.find('.rateshow').html(box.data.rate);
				mainbox.find('.timeshow').html(box.data.leftSecond);
			}
		}else{
			events.myalert(data.data.err.msg);
		}
	}
}
$(function(){
	// 封号
	$('body').on('click','.ban-btn',function(){
		var val = $(this).prev('.ban-state').attr('data-state');
		if(val == 0 || val == '0'){
			parent.$("#ban").modal('show');
		}
	});
	// 全服
	events.$ajax(actions.queryJackpot,{},callback.get_list,'',$('#query_body'));
	// 修改输入框
	$('body').on('click','.eidts-btn,.eidts-btnq',function(){
	  var data;
	  if($(this).hasClass('eidts-btn')){
	  	var box = $(this).parents('.edit-mainbox');
	  	var type = $(this).attr('data-type');
	  	var rate =box.find('.rateinput').val();
	  	var leftSecond = box.find('.timeinput').val();
	  	var uid = $(this).attr('data-uid') ? $(this).attr('data-uid') :'';

	  	var parm = uid ? {'type':type,'rate':rate,'leftSecond':leftSecond,'uid':uid} :{'type':type,'rate':rate,'leftSecond':leftSecond}
	  	data = {
	  		'data':parm,
	  		'url':actions.changeCatchRate,
	  		'obj':$(this),
	  		'changenum':2,
	  		'rang':'no'
	  	}
	  }else{
	  	var key = $(this).attr('data-key');
	  	var value = $(this).parents('tr').find('.eidt-input').val();
	  	data = {
	  		'data':{'key':key,'value':value},
	  		'url':actions.changeQueryServerPeriod,
	  		'obj':$(this),
	  		'changenum':1,
	  		'rang':'no'
	  	}
	  }
	  events.eidtchange($(this),callback.eidts,data);
	  
	}) ;
	$('body').on('click','.eidts-btns',function(){
		var _this = $(this);
		var data = {
			'data':{'key':_this.attr('data-key'),'value':_this.parents('tr').find('.eidt-input').val(),'name':_this.attr('data-name')},
			'url':actions.editScene,
			'obj':$(this),
			'changenum':1,
			'rang':'yes'
		}
		events.eidtchange($(this),callback.eidts,data);
	})
	// 服务器周期控制
	events.$ajax(actions.period,{},callback.get_list,'',$('#period_body'));
	// 场景命中
	events.$ajax(actions.getScene,{},callback.get_list,'',$('#scene_body'));
	$('body').on('click','#fresh_btn',function(){
		events.$ajax(actions.getScene,{},callback.get_list,'',$('#scene_body'));
	});
	// 快速查询玩家
	$('body').on('click','#search_player',function(){
		var uid = $('#uidsbox').val();
		if(uid){
			events.$ajax(actions.queryPlayer,{'uid':uid},callback.get_list,'',$('#player_body'));
		}else{
			events.myalert(namebox.filluid)
		}
	});
	// 体现数据预览
	events.$ajax(actions.getCashData,{'start':1,'length':actions.listnum},callback.get_list,'',$('#cash_body'));
	// 点击分页
	$('body').on('click','.cash-pagination a[data-page]',function(){
		var data = events.clickPage($(this));
		events.$ajax(actions.getCashData,{'start':data.startpage,'length':actions.listnum},callback.get_list,'',$('#cash_body'));
	});
	// 盈亏排名
	events.$ajax(actions.profit,{'start':1,'length':actions.profit_num,'type':$('.sort-type').attr('data-type')},callback.get_list,'',$('#profit_body'));
	// 排序
	$('body').on('click','.sortbtn',function(){
		var typenum;
		if($('.sort-type').attr('data-type') == 1){
			typenum = 2;
		}else{
			typenum = 1
		}
		$('.sort-type').attr('data-type',typenum);
		events.$ajax(actions.profit,{'start':1,'length':actions.profit_num,'type':typenum},callback.get_list,'',$('#profit_body'));
	})
	// 点击分页
	$('body').on('click','.profit-pagination a[data-page]',function(){
		var data = events.clickPage($(this));
		events.$ajax(actions.profit,{'start':data.startpage,'length':actions.profit_num,'type':1},callback.get_list,'',$('#profit_body'));
	});
});
