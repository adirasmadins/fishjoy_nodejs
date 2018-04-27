// 接口
var actions = {
	'list_url':'/admin/getBroadcast',
	'cancel':'/admin/cancelBroadcast',
	'add':'/admin/addBroadcast',
	'listnum':500
}
// 回调
var callback = {
	get_list:function(data){
		$('#notice_body').html(template('notice_box', data));
	},
	cancel:function(data,parm,obj){
		if(data.data.result == true){
			obj.remove();
		}
	},
	add:function(data){
		parent.$('#addnotice').modal('hide');

		if(data.data.result == true){
			setTimeout(function(){
				events.myalert(namebox.succ,function(){
					// window.location.reload();
					events.$ajax(actions.list_url,{},callback.get_list);
				})
			},300);
		}else{
			setTimeout(function(){
				events.myalert(namebox.fail)
			},300)
		}
	}
}
	$(function(){
		// 初始化列表
		events.$ajax(actions.list_url,{},callback.get_list);
		// 点击取消
		$('body').on('click','.cancel-btn',function(){
			var id = $(this).attr('data-id');
			var obj = $(this).parents('tr');
			events.myalert(namebox.cancel,function(){
				events.$ajax(actions.cancel,{'id':id},callback.cancel,'',obj);
			});
		});
		var p_modal = parent.$('#modal');
		// 添加公告弹窗
		$('body').on('click','#add_notice',function(){
			events.$get('add_notice.html',function(result){parent.$('#modal').html(result).find('.modal').modal('show')});
		});
		p_modal.on('click','.add-surebtn',function(){
			var content = p_modal.find('#content').val(),
			gap = p_modal.find('#gap').val(),
			repeat = p_modal.find('#repeat').val(),
			startTime =  p_modal.find('[name="start_time"]').val(),
			endTime = p_modal.find('[name="end_time"]').val();
			var modal_tip =  p_modal.find('.modal-tip');
			if(content && gap && repeat && startTime && endTime){
				modal_tip.html('');
				events.$ajax(actions.add,{'content':content,'gap':gap,'repeat':repeat,'startTime':startTime,'endTime':endTime},callback.add);
			}else{
				modal_tip.html(namebox.filltip);
			}

		})
	})