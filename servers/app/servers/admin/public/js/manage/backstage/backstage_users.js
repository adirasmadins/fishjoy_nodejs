// 接口
var actions = {
	'list_url':'/admin/getOperator',
	'modify':'/admin/modifyOperatorPassword',
	'addOperator':'/admin/addOperator',
	'authSwitch':'/admin/authSwitch'
}
// 接口回调
var callback = {
	// 初始化回调
	get_back:function(data){
		$('#user_body').html(template('user_data', data));
	},
	// 修改回调
	editpsd:function(data){
		if(data.data.result == true){
			setTimeout(function(){events.myalert(namebox.succ);},300)
		}
	},
	// 新增回调
	adduser:function(data){
		console.log('新增回调')
		if(data.data.result == true){
			setTimeout(function(){events.myalert(namebox.succ,function(){events.$ajax(actions.list_url,{},callback.get_back)});},300)
			// function(){window.location.reload()
		}else{
			setTimeout(function(){events.myalert(data.data.err);},300)
		}
	}
}

$(function(){
	// 获取列表
	events.$ajax(actions.list_url,{},callback.get_back);
	var p_modal = parent.$('#modal');
	// 修改密码
	$('body').on('click','.change-psd',function(){
		var uname = $(this).parents('tr').find('.uname').html();
		$('#username').val(uname);
		p_modal.html($('#nes_psd').clone()).find('.modal').modal('show');
	});
	p_modal.on('click','.update-btn',function(){
		var name = p_modal.find('#username').val(),newpasd = p_modal.find('#newpasd').val();
		var modal_tip =  p_modal.find('.modal-tip');
		if(newpasd){
			modal_tip.html('');
			p_modal.find('.modal').modal('hide');
			events.$ajax(actions.modify,{'username':name,'password':newpasd},callback.editpsd);
		}else{
			modal_tip.html(namebox.filltip);
		}
	})
	// 新增用户
	$('body').on('click','#add_user',function(){
		p_modal.html($('#adduser').clone()).find('.modal').modal('show');
	});
	p_modal.on('click','.add-suerbtn',function(){
			var name = p_modal.find('#name').val(),pasd = p_modal.find('#pasd').val(),repasd = p_modal.find('#repasd').val();
		var modal_tip =  p_modal.find('.modal-tip');
		if(name && pasd && repasd){
			modal_tip.html('');
			p_modal.find('.modal').modal('hide');
			events.$ajax(actions.addOperator,{'username':name,'password':pasd},callback.adduser);
		}else{
			modal_tip.html(namebox.filltip);
		}
	});
	// 权限开关
	$('body').on('change','input[type="radio"]',function(){
	  var auth = $(this).val();
	  var username = $(this).parents('tr').find('.uname').html();
	  events.$ajax(actions.authSwitch,{'username':username,'auth':auth},callback.editpsd);
	})

});