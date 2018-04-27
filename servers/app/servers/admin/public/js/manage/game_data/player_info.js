// 接口
var actions = {
	'list_url':'/admin/playerData',
	'freezePlayer':'/admin/freezePlayer',
	'listnum':500
}
// 回调
var callback = {
	get_list:function(data,p){
		pagination(p.start?p.start :1,data.data.pages,data.data.rows);
		$('#data_body').html(template('data_box', data.data));
	},
	right:function(data,parm,obj){
		var op = obj.attr('data-type');
		parent.$('#modal').find('#email-tip').modal('hide');
		console.log(parent.$('#modal'));
		    if(data.data.result == true){
		    	if(op == 'unfreeze'){
		    		obj.removeClass('btn-success relieve').addClass('btn-warning defriend').html(namebox.defriend).prev('span').html(namebox.no);
		    	}else{
		    		obj.removeClass('btn-warning defriend').addClass('btn-success relieve').html(namebox.relieve).prev('span').html(namebox.yes);
		    	}
			}else{
				setTimeout(function(){
					events.myalert(namebox.fail);
				},300)
			}
	}
}

$(function(){
	// relieve 解除，拉黑
	$('body').on('click','.relieve,.defriend',function(){
		var _this = $(this);
		var uid = $(this).attr('data-id');
		var tip = '',op = '';
		if($(this).hasClass('relieve')){
			tip = namebox.unfreeze;
			op = 'unfreeze' ;
		}else{
			tip = namebox.freeze;
			op = 'freeze' ;
		}
		$(this).attr('data-type',op);
		events.myalert(tip,function(){events.$ajax(actions.freezePlayer,{'uid':uid,'op':op},callback.right,'',_this)});
		// function(){right(uid,op);}
	});
	// 初始化数据
	events.$ajax(actions.list_url,{'start':1,'length':actions.listnum},callback.get_list);
	// 搜索
	$('body').on('click','#search_btn',function(){
		var uids = $('#uid_box').val();
		$(this).attr({'data-uid':uids});
		events.$ajax(actions.list_url,{'uid':uids,'start':1,'length':actions.listnum},callback.get_list);
	});
	// 点击分页
	$('body').on('click','.pagination a[data-page]',function(){
		var data = events.clickPage($(this));
		var uids = $('#uid_box').val();
		events.$ajax(actions.list_url,{'uid':uids,'start':data.startpage,'length':actions.listnum},callback.get_list);
	})
})

