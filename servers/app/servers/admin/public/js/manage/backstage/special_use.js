// 接口
var actions = {
	'url':'/admin/generateDailyData',
    'serverSwitch':'/admin/serverSwitch',
    'getServerSwitch':'/admin/getServerSwitch'
}
// 接口回调
var callback = {
	// 初始化回调
	get_back:function(data){
		console.log(data);
		if(data.data.result == true){
			events.myalert(namebox.succ);
		}
	},
    get_satus:function(data){
        console.log(data);
        if(data.data.result == true){
            if(data.data.switchStatus == '1'){
                console.log(99)
                $('#radio_open').attr('checked','checked');
                $('#msgbox').removeClass('hide').find('#msg_box').val(data.data.switchMsg);
            }else{
              $('#radio_close').attr('checked','checked');
              $('#msgbox').addClass('hide').find('#msg_box').val('');  
            }
            
        }
    },
    change_back:function(data){
        console.log(data);
        if(data.data.result == true){
            events.myalert(namebox.succ);
        }else{
            events.myalert(namebox.fail);
        }
    }
}
$(function(){
	$('.s_date,.e_date').find('input').val(events.get_today());
	$('body').on('click','#search_btn',function(){
		events.$ajax(actions.url,{'startDate':$('[name="start_time"]').val(),'endDate':$('[name="end_time"]').val()},callback.get_back);
	})
    $('body').on('change','input[type="radio"]',function(){
      var val = $(this).val();
      if(val == 1){
        $('#msgbox').removeClass('hide');
      }else{
        $('#msgbox').addClass('hide');
      }
    });
    // 获取默认开关状态
    events.$ajax(actions.getServerSwitch,{'type':1},callback.get_satus);
    // 开关提交
    $('body').on('click','#syetembtn',function(){
        var radio_val = $('input[type="radio"]:checked').val();
        var msg = $('#msg_box').val();
        if(radio_val == 1){
            if(msg){
                events.$ajax(actions.serverSwitch,{'type':1,'value':radio_val,'msg':msg},callback.change_back);
            }else{
                events.myalert('打开开关需要输入msg!');
            }
        }else{
            events.$ajax(actions.serverSwitch,{'type':1,'value':radio_val},callback.change_back);
        }

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