// 接口
var actions = {
	'list_url':'/admin/getChangeLog',
	'confirm':'/admin/confirmChange',
	'cancel':'/admin/cancelChange',
	'listnum':500
}
// 回调
var callback = {
	get_list:function(data,p){
		$('#order_body').html(template('order_data', data));
		pagination(p.start?p.start :1,data.data.pages,data.data.rows);
	},
	handel:function(data){
		parent.$('.modal').modal('hide');
		setTimeout(function(){
			events.myalert(namebox.succ,function(){
				// window.location.reload();
				var sday = $('#search_btn').attr('data-sday');
				var eday = $('#search_btn').attr('data-eday');
				var uids = $('#search_btn').attr('data-uid');
				var filter = {'orderCatalog':callback.select($('.orderCatalog')), 'orderStatus':callback.select($('.orderStatus')) };
				events.$ajax(actions.list_url,{'startDate':sday,'endDate':eday,'uid':uids,'start':1,'length':actions.listnum,filter},callback.get_list);
			})
		},300)
	},
	select:function(obj,arr){
		var a = [];
		$.each(obj,function(i,n){
			var check = $(n).prop('checked');
			if(check == true){
				a.push($(n).val())
			}
		});
		return a;
	},
	edit_back:function(data){
		console.log(data);
		if(data.data.result == true){
			events.myalert(namebox.succ);
		}else{
			events.myalert(data.data.err);
		}
	}
}
$(function(){
	// 点击取消
	$('body').on('click','.cancel-btn',function(){
		var tip = '',url;
		var id = $(this).attr('data-id');
		tip = namebox.cancel; 
		url = actions.cancel;
		events.myalert(tip,function(){
			events.$ajax(url,{'orderId':id},callback.handel);
		});
	});
	// 点击确定
	$('body').on('click','.ok-btn',function(){
		var tip = '',url;
		var id = $(this).attr('data-id');
		tip = namebox.ifsure;
		url = actions.confirm; 
		var val1 = $(this).parent('td').siblings('.serial-box').find('.serial').val();
		var val2 = $(this).parent('td').siblings('.password-box').find('.password').val();
		var catalog = $(this).attr('data-catalog');
		var data;
		if(catalog == '1'){
			data = {
				'serial':val1 ? val1 : '',
				'password':val2 ? val2 : ''
			}
		}else{
			data = {
				'way':val1 ? val1 : '',
				'thingnum':val2 ? val2 : ''
			}
		}
		if(val1 && val2){
			events.myalert(tip,function(){
				events.$ajax(url,{'orderId':id,'info':data},callback.handel);
			});
		}else{
			events.myalert(namebox.alertTip);
		}
	});
	// 初始化数据
	$('.s_date,.e_date').find('input').val(events.get_today());
	$('#search_btn').attr({'data-sday':events.get_today(),'data-eday':events.get_today()});

	var filter = {'orderCatalog':callback.select($('.orderCatalog')), 'orderStatus':callback.select($('.orderStatus')) };
	events.$ajax(actions.list_url,{'startDate':events.get_today(),'endDate':events.get_today(),'start':1,'length':actions.listnum,filter},callback.get_list);
	// 搜索
	$('body').on('click','#search_btn',function(){
		var sday = $('.s_date').find('input').val();
		var eday = $('.e_date').find('input').val();
		var uids = $('#uid_box').val();
		$(this).attr({'data-sday':sday,'data-eday':eday,'data-uid':uids});
		var filter = {'orderCatalog':callback.select($('.orderCatalog')), 'orderStatus':callback.select($('.orderStatus')) };
		console.log(uids);
		if(sday && eday){
			events.$ajax(actions.list_url,{'startDate':sday,'endDate':eday,'uid':uids,'start':1,'length':actions.listnum,filter},callback.get_list);
		}else{
			events.myalert(namebox.alertTip);
		}
	});
	// 点击分页
	$('body').on('click','.pagination a[data-page]',function(){
		var data = events.clickPage($(this)); 
		var uids = $('#search_btn').attr('data-uid');
		events.$ajax(actions.list_url,{'startDate':data.sday,'endDate':data.eday,'uid':uids,'start':data.startpage,'length':actions.listnum,filter},callback.get_list);
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

		var newChart = echarts.init(document.getElementById('goods_source'));
		var option = {
		    title: {
		        // text: '折线图堆叠'
		    },
		    tooltip: {
		        trigger: 'axis'
		    },
		    legend: {
		        data:['活跃设备数','活跃用户数','新注册设备','新注册用户']
		    },
		    grid: {
		        left: '3%',
		        right: '4%',
		        bottom: '3%',
		        containLabel: true
		    },
		    toolbox: {
		        feature: {
		            saveAsImage: {}
		        }
		    },
		    xAxis: {
		        type: 'category',
		        boundaryGap: false,
		        // data:[]
		        data: ['00:00','02:00','04:00','06:00','08:00','10:00','12:00','14:00','16:00','18:00','20:00','22:00']
		    },
		    yAxis: {
		        type: 'value'
		    },
		    series: [
		        {
		            name:'活跃设备数',
		            type:'line',
		            smooth: true,
		            // stack: '总量',
		            symbol:'circle',
	                symbolSize:'6',
	                // data:[]
		            data:[120, 132, 101, 134, 90, 230, 210,120, 132, 101, 134, 90,]
		        },
		        {
		            name:'活跃用户数',
		            type:'line',
		            smooth: true,
		            // stack: '总量',
		            symbol:'circle',
	                symbolSize:'6',
	                // data:[]
		            data:[220, 182, 191, 234, 290, 330, 310, 182, 191, 234, 290, 330,]
		        },
		        {
		            name:'新注册设备',
		            type:'line',
		            smooth: true,
		            // stack: '总量',
		            symbol:'circle',
	                symbolSize:'6',
	                // data:[]
		            data:[150, 232, 201, 154, 190, 330, 410, 232, 201, 154, 190, 330,]
		        },
		        {
		            name:'新注册用户',
		            type:'line',
		            smooth: true,
		            // stack: '总量',
		            symbol:'circle',
	                symbolSize:'6',
	                // data:[]
		            data:[320, 332, 301, 334, 390, 330, 320, 332, 301, 334, 390, 330,]
		        }
		    ]
		};
	 	newChart.setOption(option);
