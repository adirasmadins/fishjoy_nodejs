// 接口
var actions = {
	'list_url':'/admin/getGiftCodeData',
	'genGiftCode':'/admin/genGiftCode',
	'getGiftCodeConfig':'/admin/getGiftCodeConfig',
	'getGiftCodeList':'/admin/getGiftCodeList',
	'loadlist':'/admin/downloadGiftCodeList',
	'serverSwitch':'/admin/serverSwitch',
	'getServerSwitch':'/admin/getServerSwitch',
	'databox':{},
	'data':{'gift':{}}
}
// 回调
var callback = {
	get_list:function(data){
		if(data.data.length>0){
			$('#giftcode_body').html(template('giftcode_box', data));
		}
		
	},
	genGiftCode:function(data){
		if(data.data.result == true){
			events.myalert(namebox.succ,function(){
				window.location.reload();
			})
		}
	},
	select:function(){
		var id = $('#choosegift').val();
		$.each(actions.databox,function(i,n){
			if(n.id == id){
				actions.data.gift = n ;
				$('#giftbox_body').html(template('giftbox', actions.data));
				return false;
			}
		})
	},
	getGiftCodeConfig:function(data){
		if(data.data.length>0){
			$('#choosegift').html('');
			$.each(data.data,function(i,n){
				$('#choosegift').append('<option value="'+n.id+'">'+n.title+'</option>');
			});
			actions.databox = data.data;
			actions.data.gift = data.data[0] ;
			$('#giftbox_body').html(template('giftbox', actions.data));
		}
	},
	getGiftCodeList:function(data){
		$('#creact_body').html(template('creact_box', data));
	},
	loadlist:function(data){
		if(data.data.result == true){
			events.myalert(namebox.succ);
		}
	},  
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
	events.$ajax(actions.list_url,{'giftCode':''},callback.get_list);
	events.$ajax(actions.getGiftCodeList,{},callback.getGiftCodeList);
	// callback.select();
	events.$ajax(actions.getGiftCodeConfig,{},callback.getGiftCodeConfig);
	// 获取默认开关状态
	events.$ajax(actions.getServerSwitch,{'type':2},callback.get_satus);
	// 开关提交
	$('body').on('click','#syetembtn',function(){
	    var radio_val = $('.open-close [type="radio"]:checked').val();
	    events.myalert(namebox.sure_tip,function(){
	    	events.$ajax(actions.serverSwitch,{'type':2,'value':radio_val},callback.change_back);
	    })
	    
	})
	// 搜索
	$('body').on('click','#search_btn',function(){
		var uids = $('#uid_box').val();
		events.$ajax(actions.list_url,{'giftCode':uids},callback.get_list);
	});
	// 点击生成
	$('body').on('click','.creat-gift',function(){
		var prefix = $('#prefix').val(),
			num = $('#num').val(),
			limit = $('#limit').val();
		if(prefix && num && limit){
			events.$ajax(actions.genGiftCode,{'prefix':prefix,'num':num,'limit':limit,'action_id':$('#choosegift').val()},callback.genGiftCode);
		}else{
			events.myalert(namebox.filltip);
		}
	});
	
	$('body').on('change','#choosegift',function(){
		callback.select();
	});
	// 下载
	$('body').on('click','.loadbtn',function(){
		var time = $(this).attr('data-time');
		// events.$ajax(actions.loadlist,{'time':time},callback.loadlist);
		download(time);
	})

})
function download(time) {
    
    var params = {
        time: time
    };
    
    var form = $("<form>");
    form.attr('style', 'display:none');
    form.attr('target', '');
    form.attr('method', 'post');
    form.attr('action', actions.loadlist);
    
    var input = $('<input>');
    input.attr('type', 'hidden');
    input.attr('name', 'data');
    input.attr('value', JSON.stringify(params));
    
    $('body').append(form);
    form.append(input);
    
    form.submit();
    form.remove();
};
template.helper('joinstring',function(a){
	var r ; 
	return r = a ? a.join(',') : '';
})
