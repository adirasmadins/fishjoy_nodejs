// 接口
var actions = {
	'list_url':'/admin/retentionData'
}
// 回调
var callback = {
	get_list:function(data){
		$('#keep_body').html(template('keep_data', data));
		var time = [],avgHourOnline = [],maxHourOnline = [],activeAccount = [],newAccount = [],retention1 = [],retention3 = [],
		retention7 = [],retention14 = [],retention30 = [],fightServerPlayerCountMax = [],fightServerPlayerCountAvg = [] ,rankMatchPlayerCountMax = [],rankMatchPlayerCountAvg = [];
		$.each(data.data,function(i,n){
			time.push(n.time);
			avgHourOnline.push(n.avgHourOnline);
			maxHourOnline.push(n.maxHourOnline);
			activeAccount.push(n.activeAccount);
			newAccount.push(n.newAccount);
			fightServerPlayerCountMax.push(n.fightServerPlayerCountMax);
			fightServerPlayerCountAvg.push(n.fightServerPlayerCountAvg);
			rankMatchPlayerCountMax.push(n.rankMatchPlayerCountMax);
			rankMatchPlayerCountAvg.push(n.rankMatchPlayerCountAvg);

			retention1.push(n.retention1.replace(/%/g,''));
			retention3.push(n.retention3.replace(/%/g,''));
			retention7.push(n.retention7.replace(/%/g,''));
			retention14.push(n.retention14.replace(/%/g,''));
			retention30.push(n.retention30.replace(/%/g,''));
		});
		newChart.setOption({
				xAxis: {
				    data:time
				},
				series: [{
				    name:namebox.chart[0],
				    data:avgHourOnline,
				     type: 'bar'
				},
				{
				    name:namebox.chart[1],
				    data:maxHourOnline,
				     type: 'bar'
				},
				{
				    name:namebox.chart[2],
				    data:activeAccount,
				     type: 'bar'
				},
				{
				    name:namebox.chart[3],
				    data:newAccount,
				     type: 'bar'
				},
				{
				    name:namebox.chart[4],
				    data:fightServerPlayerCountMax,
				     type: 'bar'
				},
				{
				    name:namebox.chart[5],
				    data:fightServerPlayerCountAvg,
				     type: 'bar'
				},
				{
				    name:namebox.chart[6],
				    data:rankMatchPlayerCountMax,
				     type: 'bar'
				},
				{
				    name:namebox.chart[7],
				    data:rankMatchPlayerCountAvg,
				     type: 'bar'
				},
				{
				    name:namebox.chart[8]+'(%)',
				    data:retention1,
			        type:'line',
			        yAxisIndex: 1,
				},
				{
				    name:namebox.chart[9]+'(%)',
				    data:retention3,
			        type:'line',
			        yAxisIndex: 1,
				},
				{
				    name:namebox.chart[10]+'(%)',
				    data:retention7,
			        type:'line',
			        yAxisIndex: 1,
				},
				{
				    name:namebox.chart[11]+'(%)',
				    data:retention14,
			        type:'line',
			        yAxisIndex: 1,
				},
				{
				    name:namebox.chart[12]+'(%)',
				    data:retention30,
			        type:'line',
			        yAxisIndex: 1,
				}
				]
			})
	}
}

$(function(){
	// 初始化数据
	$('.s_date').find('input').val(events.get_before(30));
	$('.e_date').find('input').val(events.get_today());
	events.$ajax(actions.list_url,{'startDate':events.get_before(30),'endDate':events.get_today()},callback.get_list);
	// 搜索
	$('body').on('click','#search_btn',function(){
		var sday = $('.s_date').find('input').val();
		var eday = $('.e_date').find('input').val();
		if(sday && eday){
			events.$ajax(actions.list_url,{'startDate':sday,'endDate':eday},callback.get_list);
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

		var newChart = echarts.init(document.getElementById('goods_source'));

		var option2 = {
		    tooltip: {
		        trigger: 'axis',
		        axisPointer: {
		            type: 'cross',
		            crossStyle: {
		                color: '#999'
		            }
		        }
		    },
		    // toolbox: {
		    //     feature: {
		    //         dataView: {show: true, readOnly: false},
		    //         magicType: {show: true, type: ['line', 'bar']},
		    //         restore: {show: true},
		    //         saveAsImage: {show: true}
		    //     }
		    // },
		    legend: {
		        data:namebox.chart
		    },
		    xAxis: [
		        {
		            type: 'category',
		            data:[],
		            axisPointer: {
		                type: 'shadow'
		            }
		        }
		    ],
		    yAxis: [
		        {
		            type: 'value',
		            name: namebox.peopleNum,
		            // min: 0,
		            // max: 250,
		            // interval: 1000,
		            axisLabel: {
		                formatter: '{value} '
		            }
		        },
		        {
		            type: 'value',
		            name: namebox.percent,
		            // min: 0,
		            // max: 25,
		            // interval: 5,
		            axisLabel: {
		                formatter: '{value} %'
		            }
		        }
		    ],
		    series: [
		    ]
		};

	 	newChart.setOption(option2);