// 接口
var actions = {
	'list_url':'/admin/getFireData',
	'genGiftCode':'/admin/genGiftCode'
}
// 回调
var callback = {
	get_list:function(data){
		$('#fire_body').html(template('fire_data', data.data));
		$('#profitRateHistory').html(data.data.profitRateHistory);
		$('#profitRateToday').html(data.data.profitRateToday);
		var time = [],fire = [],cost = [],gain = [],profitRate = [],l5 = [],l6 = [],activeAccount = [],newAccount = [];
		$.each(data.data.chart,function(i,n){
			time.push(n.time);
			fire.push(n.fire);
			cost.push(n.cost);
			gain.push(n.gain);
			profitRate.push(n.profitRate*100);
		});
		newChart.setOption({ 
			title:{text:'Historical NRU'},
		    xAxis: {
		        data:time
		    },
		    series: [
		    	        {
		    	            name:namebox.chart[0],
		    	            type:'line',
		    	            smooth: true,
		    	            symbol:'circle',
		                    symbolSize:'6',
		                    data:fire
		    	        },
		    	        {
		    	            name:namebox.chart[1],
		    	            type:'line',
		    	            smooth: true,
		    	            symbol:'circle',
		                    symbolSize:'6',
		                    data:cost
		    	        },
		    	        {
		    	            name:namebox.chart[2],
		    	            type:'line',
		    	            smooth: true,
		    	            symbol:'circle',
		                    symbolSize:'6',
		                    data:gain
		    	        },
		    	        {
		    	            name:namebox.chart[3]+'(%)',
		    	            type:'line',
		    	            smooth: true,
		    	            symbol:'circle',
		                    symbolSize:'6',
		                    data:profitRate
		    	        }
		    ]
		});
	},
	genGiftCode:function(data){
		console.log(data);
	}
}
	$(function(){
		// 初始化数据
		$('.s_date').find('input').val(events.get_today());
		$('#search_btn').attr({'data-sday':events.get_today(),'data-eday':events.get_today()})
		events.$ajax(actions.list_url,{'date':events.get_today()},callback.get_list);
		// 搜索
		$('body').on('click','#search_btn',function(){
			var sday = $('.s_date').find('input').val();
			if(sday){
				events.$ajax(actions.list_url,{'date':sday},callback.get_list);
			}else{
				events.myalert(namebox.filltip);
			}
		});
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


		var newChart = echarts.init(document.getElementById('goods_source'));
		var option = {
		    title: {
		        // text: '折线图堆叠'
		    },
		    tooltip: {
		        trigger: 'axis'
		    },
		    legend: {
		        data:namebox.chart
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
		        data:[]
		        // data: ['00:00','02:00','04:00','06:00','08:00','10:00','12:00','14:00','16:00','18:00','20:00','22:00']
		    },
		    yAxis: {
		        type: 'value'
		    },
		    series: [
		        
		    ]
		};
	 	newChart.setOption(option);

