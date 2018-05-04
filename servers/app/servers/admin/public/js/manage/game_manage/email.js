// 接口
var actions = {
	'list_url':'/admin/getMailData',
	'delMail':'/admin/delMail',
	'sendMail':'/admin/sendMail',
	'sendMailCompensation':'/admin/sendMailCompensation',
	'listnum':500
}
// 回调
var callback = {
	get_list:function(data){
		$('#email_body').html(template('email_data', data));
	},
	cancel:function(data,parm,obj){
		obj.html('<span>'+namebox.canceled+'</span>');
	},
	addEmail:function(data){
		parent.$('#addemail').modal('hide');
		if(data.data.result == true){
			var sday = $('#search_btn').attr('data-sday');
			var eday = $('#search_btn').attr('data-eday');
			setTimeout(function(){
				events.myalert(namebox.succ,function(){
					// window.location.reload();
					events.$ajax(actions.list_url,{'startDate':sday,'endDate':eday},callback.get_list);
				})
			},300)
		}else{
			setTimeout(function(){
				events.myalert(namebox.fail)
			},300)
		}

	}
}
	$(function(){
		// 初始化数据
		$('.s_date,.e_date').find('input').val(events.get_today());
		$('#search_btn').attr({'data-sday':events.get_today(),'data-eday':events.get_today()});
		events.$ajax(actions.list_url,{'startDate':events.get_today(),'endDate':events.get_today()},callback.get_list);
		// 搜索
		$('body').on('click','#search_btn',function(){
			var sday = $('.s_date').find('input').val();
			var eday = $('.e_date').find('input').val();
			var mailId = $('#mailId').val();
			$(this).attr({'data-sday':sday,'data-eday':eday,'data-mailId':mailId});
			if(sday && eday){
				var data = mailId ? {'startDate':sday,'endDate':eday,'mailId':mailId} : {'startDate':sday,'endDate':eday} ;
				events.$ajax(actions.list_url,data,callback.get_list);
			}else{
				events.myalert(namebox.alertTip);
			}
		});
		// 点击取消
		$('body').on('click','.cancel-btn',function(){
			var id = $(this).attr('data-id');
			var obj = $(this).parent('td');
			events.myalert(namebox.cancel,function(){
				events.$ajax(actions.delMail,{'id':id},callback.cancel,'',obj);
			});
		});
		// 添加邮件弹窗
		$('body').on('click','#add_email',function(){
			events.$get('add_email.html',function(result){parent.$('#modal').html(result).find('.modal').modal('show')});
		});
		var p_modal = parent.$('#modal');
		p_modal.on('click','.add-surebtn',function(){
			var modal_tip =  p_modal.find('.modal-tip');
			var formbox = p_modal.find('.tab-pane.active');
			var type = p_modal.find('.nav-tabs').find('.active').attr('data-type');
				var content = formbox.find('.content').val(),
				title = formbox.find('.formtitle').val(),
				reward = formbox.find('.reward').val(),
				uid =  formbox.find('.uid').val(),
				delay = formbox.find('.delay').val(),
				serial = formbox.find('#serial').val(),
				code = formbox.find('#code').val(),
				money = formbox.find('#money').val(),
				gold = formbox.find('#gold').val(),
				data = {};
			switch (type) {
				case '1' : 
						data = {'content':content,'title':title,'reward':reward,'type':type,'delay':delay};
						if(content && title && reward && type && delay){
							events.$ajax(actions.sendMail,data,callback.addEmail);
						}else{
							modal_tip.html(namebox.filltip);
						}
						break;
				case '2' : 
						data = {'content':content,'title':title,'reward':reward,'type':type,'uid':uid,'delay':delay};
						if(content && title && reward && type && uid && delay){
							events.$ajax(actions.sendMail,data,callback.addEmail);
						}else{
							modal_tip.html(namebox.filltip);
						}
						break;
				case '3' : data = {'serial':serial, 'code':code, 'money':money, 'gold':gold, 'uid':uid, 'delay':delay};
						if(serial && code && money && gold && uid && delay){
							events.$ajax(actions.sendMailCompensation,data,callback.addEmail);
						}else{
							modal_tip.html(namebox.filltip);
						}
						break;
			}

		})
	})
	template.helper('arrbox',function(a){
		var tt = [];
		$.each(a,function(i,n){
			var t = '['+"'"+n[0]+"'"+','+n[1]+']';
			tt.push(t);
		});
		return '['+tt.join(',')+']';
	});
	template.helper('joinstring',function(a){
		return a.join(',');
	});
	template.helper('ifarry',function(ary){
		return ary.constructor==Array;
	});
	// 时间选择
	$('.s_date').datetimepicker({
	    todayBtn:  1,
	    autoclose: 1,
	    todayHighlight: 1,
	    startView: 2,
	    minView: 2,
	    format: 'yyyy-mm-dd',
	    forceParse: 0,
	    pickerPosition:'bottom-left'
	}).on('changeDate',function(event){ 
	    var starttime=$('[name="start_time"]').val();
	    $('.e_date').datetimepicker('setStartDate',starttime);

	});
	$('.e_date').datetimepicker({
	    todayBtn:  1,
	    autoclose: 1,
	    todayHighlight: 1,
	    startView: 2,
	    minView: 2,
	    format: 'yyyy-mm-dd',
	    forceParse: 0,
	    pickerPosition:'bottom-left'
	}).on('changeDate',function(event){
	    var endtime=$('[name="end_time"]').val();
	    $('.s_date').datetimepicker('setEndDate',endtime);
	});