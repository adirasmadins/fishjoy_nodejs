// 接口
var actions = {
	'list_url':'/admin/realData'
}
// 回调
var callback = {
	get_list:function(data){
		var daily = data.data.daily;
		var chart = data.data.chart;
		$('#newAccount').html(daily.newAccount);
		$('#activeAccount').html(daily.activeAccount);
		$('#activeAccountAvg').html(daily.activeAccountAvg);
		$('#activeAccountMax').html(daily.activeAccountMax);
		$('#newAccountAvg').html(daily.newAccountAvg);
		$('#newAccountMax').html(daily.newAccountMax);
		$('#rel_body').html(template('rel_data', data.data));
		var time = [],l1 = [],l2 = [],l3 = [],l4 = [],l5 = [],l6 = [],activeDevice = [],activeAccount = [],newDevice = [],newAccount = [];
		$.each(data.data.chart,function(i,n){
			time.push(n.time);
			l1.push(n['0~10']);
			l2.push(n['11~20']);
			l3.push(n['21~30']);
			l4.push(n['31~40']);
			l5.push(n['41~50']);
			l6.push(n['51~60']);
			activeDevice.push(n.activeDevice),
			activeAccount.push(n.activeAccount);
			newDevice.push(n.newDevice)
			newAccount.push(n.newAccount);
			newChart.setOption({
				xAxis: {
				    data:time
				},
				series: [{
				    name:namebox.chart[0],
				    data:l1,
				     type: 'bar'
				},
				{
				    name:namebox.chart[1],
				    data:l2,
				     type: 'bar'
				},
				{
				    name:namebox.chart[2],
				    data:l3,
				     type: 'bar'
				},
				{
				    name:namebox.chart[3],
				    data:l4,
				     type: 'bar'
				},
				{
				    name:namebox.chart[4],
				    data:l5,
				     type: 'bar'
				},
				{
				    name:namebox.chart[5],
				    data:l6,
				     type: 'bar'
				},
				{
				    name:namebox.chart[6],
				    data:activeDevice,
				     type: 'bar'
				},
				{
				    name:namebox.chart[7],
				    data:activeAccount,
				     type: 'bar'
				},
				{
				    name:namebox.chart[8],
				    data:newDevice,
				     type: 'bar'
				},
				{
				    name:namebox.chart[9],
				    data:newAccount,
				     type: 'bar'
				}]
			})
		});
	}
}
$(function(){
	// 初始化数据
	$('.s_date').find('input').val(events.get_today());
	events.$ajax(actions.list_url,{'date':events.get_today()},callback.get_list);
	// 搜索
	$('body').on('click','#search_btn',function(){
		var day = $('.s_date').find('input').val();
		if(day){
			events.$ajax(actions.list_url,{'date':day},callback.get_list);
		}else{
			events.myalert(namebox.alertTip);
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
	});

		var newChart = echarts.init(document.getElementById('goods_source'));

	 	var option = {
	 		title : {
	 		       // text: '实时数据',
	 		       // subtext: '纯属虚构'
	 		   },
	 		tooltip : {
	 		           trigger: 'axis',
				        axisPointer: {
				            type: 'shadow'
				        }
	 		       },
	 			 	
	 		legend: {
	 		           // data:['活跃设备数','活跃用户数','新注册设备','新注册用户']
	 		           data:namebox.chart
	 		       },
	 	    xAxis: {
	 	        type: 'category',
	 	        // data: ['00~01', '01~02', '02~03', '03~04', '04~05', '05~06', '06~07']
	 	    },
	 	    yAxis: {
	 	        type: 'value',
	 	    },
	 	    series: [
	 	    ]
	 	};
	 	newChart.setOption(option);