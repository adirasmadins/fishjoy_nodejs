// 接口
var actions = {
	'list_url':'/admin/getPlayerData',
	'modifyPlayerData':'/admin/modifyPlayerData',
	'freezePlayer':'/admin/freezePlayer',
	'getFreezeReasonList':'/admin/getFreezeReasonList',
	'typedata':'',
	'uid':''
}
// 回调
var callback = {
	get_list:function(data){
		 $('#player_body').html(template('player_data', data));
	},
	eidts:function(data){
		console.log(data.obj);
		if(data.value){
			events.$ajax(actions.modifyPlayerData,{'key':data.key,'value':data.value,'uid':$('#truid').val()},callback.call_eidt,'',data.obj?data.obj:'');
		}
	},
	call_eidt:function(data,p,obj){
		console.log(obj);
		if(data.data.result == true){
		  events.myalert(namebox.succ);
		  if(obj){
		  	if(obj.hasClass('eidts-btny')){
		  		// obj.attr('disabled','disabled');
		  	}else{
		  		obj.parents('tr').find('.eidt-input').val(p.value);
		  		obj.parents('tr').find('.val-show').html(p.value);
		  	}
		  }
		}else{
		  events.myalert(namebox.fail);
		}
	},
	typelist:function(data){
		console.log(data);
		actions.typedata = data;

	},
	freezePlayer:function(data){
		parent.$('#ban').modal('hide');
		if(data.data.result == true){
			setTimeout(function(){
				events.myalert(namebox.succ,function(){
					// window.location.reload();
					events.$ajax(actions.list_url,{'uid':actions.uid},callback.get_list);
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
		var p_modal = parent.$('#modal');
		// 获取类型
		events.$ajax(actions.getFreezeReasonList,{},callback.typelist);
		// 封号
		$('body').on('click','.ban-btn',function(){
			var val = $(this).prev('.ban-state').attr('data-state');
			var op = $(this).attr('data-op');
			var uid = $(this).attr('data-uid');
			// if(val == 0 || val == '0'){
        		// parent.$('#modal').html($('#ban')).find('.modal').modal('show');
        		events.$get('freeze.html',function(result){
        			p_modal.html(result).find('.modal').modal('show').find('#uid').val(uid).next('#op').val(op);
        			p_modal.find('#type').html('');
        			$.each(actions.typedata.data,function(i,n){
        				p_modal.find('#type').append('<option value="'+n.reason+'">'+n.desc+'</option>');
        			})
        		});
			// }
		});
		
		p_modal.on('click','.add-surebtn',function(){
			var modal_tip =  p_modal.find('.modal-tip');
			var op = p_modal.find('#op').val();
			var uid = p_modal.find('#uid').val();
			var reason = p_modal.find('#reason').val();
			var time = p_modal.find('#time').val();
			var type = p_modal.find('#type').val();
			if(reason && time && type){
				events.$ajax(actions.freezePlayer,{'uid':uid,'op':op,'reason':reason,'time':time,'type':type},callback.freezePlayer);
			}else{
				modal_tip.html(namebox.freezetip);
			}
		})
    // 搜索
    $('body').on('click','#search_btn',function(){
      var uid = $('#uidbox').val();
      if(uid){
      	actions.uid = uid;
      	events.$ajax(actions.list_url,{'uid':uid},callback.get_list);
      }else{
        events.myalert(namebox.filltip);
      }
    })
    
    // 修改输入框
    $('body').on('click','.eidts-btn,.eidts-btny',function(){
      var key = $(this).attr('data-key');
      var value = $(this).parents('tr').find('.eidt-input').val();
      var data = {'key':key,'value':value,'changenum':1,'obj':$(this)};
      events.eidtchange($(this),callback.eidts,data);
    }) ;
    $('body').on('change','input[type="radio"]',function(){
      var val = $(this).val();
      var key = $(this).attr('name');
      callback.eidts({'key':key,'value':val});
      // eidts({'key':key,'value':val})
    })
	})