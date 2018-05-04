// 接口
var actions = {
	'list_url':'/admin/topupLog',
	'listnum':500 
}
// 回调
var callback = {
	get_list:function(data,p){
		 pagination(p.start?p.start :1,data.data.pages,data.data.rows);
		$('#topup_body').html(template('topup_data', data.data));
	},
	check_val:function(){
		var check_val = [];
		$.each($('.status'),function(i,n){
			if($(n).prop('checked')){
				check_val.push($(n).val());
			}
		});
		return check_val;
	}
}

	$(function(){
		// var status_val = callback.check_val();
		// console.log(status_val);
		// 初始化数据
		 var listnum = 500;//默认每页500条
		$('.s_date').find('input').val(events.get_today());
		$('.e_date').find('input').val(events.get_today());
		$('#search_btn').attr({'data-sday':events.get_today(),'data-eday':events.get_today(),'data-status':callback.check_val().join(),'data-uid':$('#uid_box').val()});
		events.$ajax(actions.list_url,{'startDate':events.get_today(),'endDate':events.get_today(),'status':callback.check_val().join(),'start':1,'length':actions.listnum},callback.get_list);
		// get_list(events.get_today(),events.get_today(),0,listnum);
		// 搜索
		$('body').on('click','#search_btn',function(){
			var sday = $('.s_date').find('input').val();
			var eday = $('.e_date').find('input').val();
			var status = callback.check_val();
			var uid = $('#uid_box').val();
			$(this).attr({'data-sday':sday,'data-eday':eday,'data-status':status.join(),'data-uid':uid});
			if(sday && eday && status.length>0){
				// get_list(sday,eday,0,listnum);
				var data = uid ? {'startDate':sday,'endDate':eday,'status':status.join(),'uid':uid,'start':1,'length':actions.listnum} : {'startDate':sday,'endDate':eday,'status':status.join(),'start':1,'length':actions.listnum}
				events.$ajax(actions.list_url,data,callback.get_list);
			}else{
				events.myalert(namebox.alertTip);
			}
		});
		// 点击分页
		$('body').on('click','.pagination a[data-page]',function(){
			var data = events.clickPage($(this));
			var uid = $('#search_btn').attr('data-uid');
			var parm = uid ? {'startDate':data.sday,'endDate':data.eday,'status':$('#search_btn').attr('data-status'),'uid':uid,'start':data.startpage,'length':actions.listnum} : {'startDate':data.sday,'endDate':data.eday,'status':$('#search_btn').attr('data-status'),'start':data.startpage,'length':actions.listnum}
			events.$ajax(actions.list_url,parmparm,callback.get_list);
			// get_list(data.sday,data.eday,data.startpage,listnum);
		})
	})

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