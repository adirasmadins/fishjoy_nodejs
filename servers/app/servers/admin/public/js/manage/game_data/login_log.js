// 接口
var actions = {
	'list_url':'/admin/loginLog',
	'listnum':500
}
// 回调
var callback = {
	get_list:function(data,p){
		if(data.data){
			pagination(p.start?p.start :1,data.data.pages,data.data.rows);
		      $('#data_body').html(template('data_box', data.data));
		  }else{
		  	events.myalert(data.err.code);
		  }

	}
}
$(function(){
	// 初始化数据
	$('.s_date').find('input').val(events.get_today());
	$('#search_btn').attr({'data-sday':events.get_today()});
	// events.$ajax(actions.list_url,{'date':events.get_today(),'start':1,'length':actions.listnum},callback.get_list);
	// 搜索
	$('body').on('click','#search_btn',function(){
		var sday = $('.s_date').find('input').val();
		var uids = $('#uid_box').val();
		$(this).attr({'data-sday':sday,'data-uid':uids});
		if(sday){
			events.$ajax(actions.list_url,{'date':sday,'uid':uids,'start':1,'length':actions.listnum},callback.get_list);
		}else{
			events.myalert(namebox.alertTip);
		}
	});
	// 点击分页
	$('body').on('click','.pagination a[data-page]',function(){
		var data = events.clickPage($(this));
		var uids = $('#search_btn').attr('data-uid');
		events.$ajax(actions.list_url,{'date':data.sday,'uid':uids,'start':data.startpage,'length':actions.listnum},callback.get_list);
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
});