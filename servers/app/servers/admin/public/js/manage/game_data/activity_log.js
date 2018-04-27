// 接口
var actions = {
	'list_url':'/admin/activityLog',
	'listnum':500
}
// 回调
var callback = {
	get_list:function(data,p){
		pagination(p.start?p.start :1,data.data.pages,data.data.rows);
		$('#activity_body').html(template('activity_data', data.data));
	}
}
$(function(){
	// 初始化数据
	$('.s_date,.e_date').find('input').val(events.get_today());
	// $('.e_date').find('input').val(events.get_today());
	$('#search_btn').attr({'data-sday':events.get_today(),'data-eday':events.get_today()});
	events.$ajax(actions.list_url,{'startDate':events.get_today(),'endDate':events.get_today(),'start':1,'length':actions.listnum},callback.get_list);
	// 搜索
	$('body').on('click','#search_btn',function(){
		var sday = $('.s_date').find('input').val();
		var eday = $('.e_date').find('input').val();
		$(this).attr({'data-sday':sday,'data-eday':eday})
		if(sday && eday){
			events.$ajax(actions.list_url,{'startDate':sday,'endDate':eday,'start':1,'length':actions.listnum},callback.get_list);
		}else{
			events.myalert(namebox.alertTip);
		}
	});
	// 点击分页
	$('body').on('click','.pagination a[data-page]',function(){
		var data = events.clickPage($(this)); 
		events.$ajax(actions.list_url,{'startDate':data.sday,'endDate':data.eday,'start':data.startpage,'length':actions.listnum},callback.get_list);
	})
})

// 时间选择
$('.s_date').datetimepicker({
    todayBtn:  1,
    autoclose: 1,
    todayHighlight: 1,
    startView: 2,
    minView:2,
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
    minView:2,
    format: 'yyyy-mm-dd',
    forceParse: 0,
    pickerPosition:'bottom-left'
}).on('changeDate',function(event){
    var endtime=$('[name="end_time"]').val();
    $('.s_date').datetimepicker('setEndDate',endtime);
});


