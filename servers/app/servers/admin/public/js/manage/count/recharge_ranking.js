	// 接口
	var actions = {
		'list_url':'/admin/topupChart',
		'listnum':500 
	}
	// 回调
	var callback = {
		get_list:function(data,p){
			pagination(p.start?p.start :1,data.data.pages,data.data.rows);
			$('#ranking_body').html(template('ranking_data', data.data));

		}
	}	
	$(function(){
		// 初始化数据
		events.$ajax(actions.list_url,{'start':1,'length':actions.listnum},callback.get_list);
		// 点击分页
		$('body').on('click','.pagination a[data-page]',function(){
			var data = events.clickPage($(this));
			events.$ajax(actions.list_url,{'start':data.startpage,'length':actions.listnum},callback.get_list);
		})
	})
