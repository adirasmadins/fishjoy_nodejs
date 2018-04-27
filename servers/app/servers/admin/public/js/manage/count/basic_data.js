// 接口
var actions = {
	'whole':'/admin/realData',
	'history':'retentionData'
}
// 回调
var callback = {
	// 实时数据
	whole:function(data){
		console.log(data);
		var time = [],l1 = [],l2 = [],l3 = [],l4 = [],l5 = [],l6 = [],activeAccount = [],newAccount = [];
		$.each(data.data.chart,function(i,n){
			time.push(n.time);
			l1.push(n['0~10']);
			l2.push(n['11~20']);
			l3.push(n['21~30']);
			l4.push(n['31~40']);
			l5.push(n['41~50']);
			l6.push(n['51~60']);
			activeAccount.push(n.activeAccount);
			newAccount.push(n.newAccount);
		});
		// ccu
		CCU_source.setOption({ 
		    xAxis: {
		        data:time
		    },
		    series: [
		    {
	 	    	name:'0~10',
	 	    	data:l1,
	 	        type: 'bar',
	 	        itemStyle:{
                        normal:{
                            color:'#26AF95'
                        }
                    }
	 	    },
	 	    {
	 	    	name:'11~20',
	 	    	data:l2,
	 	        type: 'bar',
	 	        itemStyle:{
                        normal:{
                            color:'#D48265'
                        }
                    }
	 	    },
	 	    {
	 	    	name:'21~30',
	 	    	data:l3,
	 	        type: 'bar',
	 	        itemStyle:{
                        normal:{
                            color:'#00B050'
                        }
                    }
	 	    },
	 	    {
	 	    	name:'31~40',
	 	    	data:l4,
	 	        type: 'bar',
	 	        itemStyle:{
                        normal:{
                            color:'#108BEB'
                        }
                    }
	 	    },
	 	    {
	 	    	name:'41~50',
	 	    	data:l5,
	 	        type: 'bar',
	 	        itemStyle:{
                        normal:{
                            color:'#2F4554'
                        }
                    }
	 	    },
	 	    {
	 	    	name:'51~60',
	 	    	data:l6,
	 	        type: 'bar',
	 	        itemStyle:{
                        normal:{
                            color:'#61A0A8'
                        }
                    }
	 	    }]
		});
		 CCU_source.hideLoading();
		//dau
		DAU_source.setOption({ 
			title:{text:'Today DAU',subtext: '(divide by 1 hour)'},
		    xAxis: {
		        data:time
		    },
		    legend: {
		        data:namebox.dau
		    },
		    series: [{
		        data:activeAccount
		    }]
		});
		// nru
		NRU_source.setOption({ 
			title:{text:'Today NRU',subtext: '(divide by 1 hour)'},
		    xAxis: {
		        data:time
		    },
		    legend: {
		        data:namebox.nru
		    },
		    series: [{
		        data:newAccount
		    }]
		});
	},
	// 历史数据
	history:function(data){
		console.log(data);
		var time = [],activeAccount = [],newAccount = [];
		$.each(data.data.chart,function(i,n){
			time.push(n.time);
			activeAccount.push(n.activeAccount);
			newAccount.push(n.newAccount);
		});
		// DAU
		H_DAU.setOption({ 
			title:{text:'Historical DAU'},
		    xAxis: {
		        data:time
		    },
		    legend: {
		        data:namebox.h_dau
		    },
		    series: [{
		        data:activeAccount
		    }]
		});
		// nru
		H_NRU.setOption({ 
			title:{text:'Historical NRU'},
		    xAxis: {
		        data:time
		    },
		    legend: {
		        data:namebox.h_nru
		    },
		    series: [{
		        data:newAccount
		    }]
		});
	}
}
$(function(){ 
	// 初始化数据 
	$('.s_date').find('input').val(events.get_before(30));
	$('.e_date').find('input').val(events.get_today());
	// 搜索
	$('body').on('click','#search_btn',function(){
		var sday = $('.s_date').find('input').val();
		var eday = $('.e_date').find('input').val();
		if(sday && eday){
			events.$ajax(actions.history,{'startDate':sday,'endDate':eday},callback.history);
		}else{
			events.myalert(namebox.alertTip);
		}
	})
	CCU_source.showLoading(); 
	events.$ajax(actions.whole,{'date':events.get_today()},callback.whole);
	events.$ajax(actions.history,{'startDate':events.get_before(30),'endDate':events.get_today()},callback.history);
})


	var CCU_source = echarts.init(document.getElementById('CCU_source'));
	
 	var option_ccu = {
 		title : {
 		       text: 'Rel-Time CCU ',
 		       subtext: '(divide by 10 minutes)'
 		   },
 		tooltip : {
 		           trigger: 'axis',
			        axisPointer: {
			            type: 'shadow'
			        }
 		       },
 	    xAxis: {
 	        type: 'category',
 	        // data: ['1', '2', '3', '4', '5', '6', '7', '8','9','10','11','12','13','14', '15', '16','17', '18', '19','20', '21', '22','23','24'],
 	        data:[],
 	        axisLabel: {
 	            // formatter: '{value} 小时'
 	            formatter: '{value}'
 	        }
 	    },
 	    yAxis: {
 	        type: 'value',
 	        // min: 0,
            // max: 120,
            // interval: 20,
            axisLabel: {
                formatter: '{value} 人'
            }
 	    },
 	    legend: {
 	               data:namebox.ccu
 	           },
 	    series: []
 	};
 	CCU_source.setOption(option_ccu);

	var DAU_source = echarts.init(document.getElementById('DAU_source'));
 	var option_dau = {
 		tooltip : {
 		           trigger: 'axis',
			        axisPointer: {
			            type: 'shadow'
			        }
 		       },
 	    xAxis: {
 	        type: 'category',
 	    },
 	    yAxis: {
 	        type: 'value',
 	        // min: 0,
            // max: 120,
            // interval: 10,
            axisLabel: {
                formatter: '{value} 个'
            }
 	    },
 	    series: [{
		 	    	// name:'00:20',
		 	        type: 'bar',
		 	        itemStyle:{
                            normal:{
                                color:'#26AF95'
                            }
                        },
                        label:{ 
								normal:{ 
								show: true, 
								position: 'top'} 
							}
		 	    }
 	    ]
 	};
 	DAU_source.setOption(option_dau);
 	var NRU_source = echarts.init(document.getElementById('NRU_source'));
	NRU_source.setOption(option_dau);

 	var H_DAU = echarts.init(document.getElementById('H_DAU'));
	H_DAU.setOption(option_dau);
 	var H_NRU = echarts.init(document.getElementById('H_NRU'));
	H_NRU.setOption(option_dau);

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