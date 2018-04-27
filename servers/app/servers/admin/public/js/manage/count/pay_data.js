// 接口
var actions = {
	'list_url':'/admin/topupData'
}
// 回调
var callback = {
	get_list:function(data){
		var sum = data.data.sum;
		$('#profitTotal').html(sum.profitTotal);
		$('#cashTotal').html(sum.cashTotal);
		$('#rechargeTotal').html(sum.rechargeTotal);
		$('#profitHistory').html(sum.profitHistory);
		$('#pay_body').html(template('pay_data', data.data));
		var time = [],activeAccount = [],newAccount = [],newPayer = [],topupTime = [],topupPeople = [],topupSum = [],
		cashSum = [],payRate = [],ARPPU = [], ARPU= [];
		$.each(data.data.chart,function(i,n){
			time.push(n.time);
			activeAccount.push(n.activeAccount);
			newAccount.push(n.newAccount);
			newPayer.push(n.newPayer);
			topupTime.push(n.topupTime);
			topupPeople.push(n.topupPeople);
			topupSum.push(n.topupSum);
			cashSum.push(n.cashSum);
			payRate.push(n.payRate.replace(/%/g,''));
			ARPPU.push(n.ARPPU);
			ARPU.push(n.ARPU)
		});
		newChart.setOption({
				xAxis: {
				    data:time
				},
				series: [{
				    name:namebox.chart[0],
				    data:activeAccount,
				     type: 'bar'
				},
				{
				    name:namebox.chart[1],
				    data:newAccount,
				     type: 'bar'
				},
				{
				    name:namebox.chart[2],
				    data:newPayer,
				     type: 'bar'
				},
				{
				    name:namebox.chart[3],
				    data:topupTime,
				     type: 'bar'
				},
				{
				    name:namebox.chart[4],
				    data:topupPeople,
			        type: 'bar'
				},
				{
				    name:namebox.chart[5],
				    data:topupSum,
			        type: 'bar'
				},
				{
				    name:namebox.chart[6],
				    data:cashSum,
			        type: 'bar'
				},
				{
				    name:namebox.chart[7]+'(%)',
				    data:payRate,
			        type:'line',
			        yAxisIndex: 1,
				},
				{
				    name:namebox.chart[8],
				    data:ARPPU,
			       type: 'bar'
				},
				{
				    name:namebox.chart[9],
				    data:ARPU,
			       type: 'bar'
				}
				]
			})
	}
}
$(function(){
		// 初始化数据
		$('.s_date').find('input').val(events.get_before(10));
		$('.e_date').find('input').val(events.get_today());
		events.$ajax(actions.list_url,{'startDate':events.get_before(10),'endDate':events.get_today()},callback.get_list);
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
	});
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