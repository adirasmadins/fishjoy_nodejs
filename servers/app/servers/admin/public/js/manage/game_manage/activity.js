// 接口
var actions = {
	'serverSwitch':'/admin/serverSwitch',
	'getServerSwitch':'/admin/getServerSwitch',
	
}
// 回调
var callback = {
	get_satus:function(data){
	    console.log(data);
	    if(data.data.result == true){
	        if(data.data.switchStatus == '1'){
	            $('.radio_open').attr('checked','checked');
	        }else{
	          $('.radio_close').attr('checked','checked');
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
	// 获取默认开关状态
	events.$ajax(actions.getServerSwitch,{'type':4},callback.get_satus);
	// 开关提交
	$('body').on('click','#syetembtn',function(){
	    var radio_val = $('.open-close [type="radio"]:checked').val();
	    console.log(radio_val)
	    events.myalert(namebox.sure_tip,function(){
	    	events.$ajax(actions.serverSwitch,{'type':4,'value':radio_val},callback.change_back);
	    })
	})

})