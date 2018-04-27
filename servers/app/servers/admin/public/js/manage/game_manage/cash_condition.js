// 接口
var actions = {
	'list_url':'/admin/cashRequireQuery',
	'cashRequire':'/admin/cashRequire',
	'serverSwitch':'/admin/serverSwitch'
}
// 回调
var callback = {
	get_list:function(data){
		$('#condition_body').html(template('condition_box', data));
	},
	eidts:function(data){
		if(data.value){
			events.$ajax(actions.cashRequire,{'key':data.key,'value':data.value},callback.call_eidt);
		}
	},
	call_eidt:function(data){
		if(data.data.result == true){
		  events.myalert(namebox.succ,function(){window.location.reload()});
		}else{
		  events.myalert(namebox.fail);
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
  // 初始化列表
  events.$ajax(actions.list_url,{},callback.get_list);
  // 修改输入框
  $('body').on('click','.eidts-btn',function(){
    var key = $(this).attr('data-key');
    var value = $(this).parents('tr').find('.eidt-input').val();
    var data = {'key':key,'value':value};
    events.eidtchange($(this),callback.eidts,data);
  }) ;
  $('body').on('change','input[type="radio"]',function(){
    var val = $(this).val();
    var key = $(this).attr('name');
    events.$ajax(actions.serverSwitch,{'type':3,'value':val},callback.change_back);
    // callback.eidts({'key':key,'value':val})
  });
  // 开关提交
  // $('body').on('click','#syetembtn',function(){
  //     var radio_val = $('input[type="radio"]:checked').val();
  //     var msg = $('#msg_box').val();
  //     if(radio_val == 1){
  //         if(msg){
  //             events.$ajax(actions.serverSwitch,{'type':1,'value':radio_val,'msg':msg},callback.change_back);
  //         }else{
  //             events.myalert('打开开关需要输入msg!');
  //         }
  //     }else{
  //         events.$ajax(actions.serverSwitch,{'type':1,'value':radio_val},callback.change_back);
  //     }

  // })
});
