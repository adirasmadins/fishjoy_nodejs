// 接口
var actions = {
	'list_url':'/admin/goldData'
}
// 回调
var callback = {
	get_list:function(data){
		$('#costTotal').html(data.data.costTotal);
		$('#gainTotal').html(data.data.gainTotal);
		$('#output_body').html(template('output_data', data.data));
		$('#input_body').html(template('input_data', data.data));
		var time = [],totalCost = [],totalGain = [],topup = [],gift = [],fishingWin = [],nuclear = [],
		active = [],mail = [],benefit = [], monthCard= [],firstTopup = [],draw = [],goldenFish = [];
		var c_time = [], c_totalGain = [], c_totalCost = [], c_cash = [], c_buySkin = [], c_buySkill = [], 
		c_nuclear = [], c_active = [], c_buyRuby = [], c_buyCard = [], c_buyVipGift = [], c_give = [], c_draw = [], c_other = [],c_fishingCost = []; 
		$.each(data.data.gain,function(i,n){
			time.push(n.time);
			totalCost.push(n.totalCost);
			totalGain.push(n.totalGain);
			topup.push(n.topup);
			gift.push(n.gift);
			fishingWin.push(n.fishingWin);
			nuclear.push(n.nuclear);
			active.push(n.active);
			mail.push(n.mail);
			benefit.push(n.benefit);
			monthCard.push(n.monthCard);
			firstTopup.push(n.firstTopup);
			draw.push(n.draw);
			goldenFish.push(n.goldenFish);
		});
		$.each(data.data.cost,function(i,n){
			c_time.push(n.time);
			c_totalGain.push(n.totalCost);
			c_totalCost.push(n.totalGain);
			c_cash.push(n.cash);
			c_fishingCost.push(n.fishingCost)
			c_buySkin.push(n.buySkin);
			c_buySkill.push(n.buySkill);
			c_nuclear.push(n.nuclear);
			c_active.push(n.active);
			c_buyRuby.push(n.buyRuby);
			c_buyCard.push(n.buyCard);
			c_buyVipGift.push(n.buyVipGift);
			c_give.push(n.give);
			c_draw.push(n.draw);
			c_other.push(n.other);
		});

		input_goods_source.setOption({
				xAxis: {
				    data:time
				},
				legend: {
				    data:namebox.input
				},
				series: [{
			            name:namebox.input[0],
			            type:'line',
			            smooth: true,
			            symbol:'circle',
		                symbolSize:'6',
		                data:totalCost
				},
				{
		            name:namebox.input[1],
		            type:'line',
		            smooth: true,
		            symbol:'circle',
	                symbolSize:'6',
	                data:totalGain
				},
				{
		            name:namebox.input[2],
		            type:'line',
		            smooth: true,
		            symbol:'circle',
	                symbolSize:'6',
	                data:topup
				},
				{
		            name:namebox.input[3],
		            type:'line',
		            smooth: true,
		            symbol:'circle',
	                symbolSize:'6',
	                data:gift
				},
				{
		            name:namebox.input[4],
		            type:'line',
		            smooth: true,
		            symbol:'circle',
	                symbolSize:'6',
	                data:fishingWin
				},
				{
		            name:namebox.input[5],
		            type:'line',
		            smooth: true,
		            symbol:'circle',
	                symbolSize:'6',
	                data:nuclear
				},
				{
		            name:namebox.input[6],
		            type:'line',
		            smooth: true,
		            symbol:'circle',
	                symbolSize:'6',
	                data:active
				},
				{
		            name:namebox.input[7],
		            type:'line',
		            smooth: true,
		            symbol:'circle',
	                symbolSize:'6',
	                data:mail
				},
				{
		            name:namebox.input[8],
		            type:'line',
		            smooth: true,
		            symbol:'circle',
	                symbolSize:'6',
	                data:benefit
				},
				{
		            name:namebox.input[9],
		            type:'line',
		            smooth: true,
		            symbol:'circle',
	                symbolSize:'6',
	                data:monthCard
				},
				{
		            name:namebox.input[10],
		            type:'line',
		            smooth: true,
		            symbol:'circle',
	                symbolSize:'6',
	                data:firstTopup
				},
				{
		            name:namebox.input[11],
		            type:'line',
		            smooth: true,
		            symbol:'circle',
	                symbolSize:'6',
	                data:draw
				},
				{
		            name:namebox.input[12],
		            type:'line',
		            smooth: true,
		            symbol:'circle',
	                symbolSize:'6',
	                data:goldenFish
				}
				]
			});
		newChart.setOption({
				xAxis: {
				    data:c_time
				},
				legend: {
				    data:namebox.cost
				},
				series: [{
			            name:namebox.cost[0],
			            type:'line',
			            smooth: true,
			            symbol:'circle',
		                symbolSize:'6',
		                data:c_totalCost
				},
				{
		            name:namebox.cost[1],
		            type:'line',
		            smooth: true,
		            symbol:'circle',
	                symbolSize:'6',
	                data:c_totalGain
				},
				{
		            name:namebox.cost[2],
		            type:'line',
		            smooth: true,
		            symbol:'circle',
	                symbolSize:'6',
	                data:c_cash
				},
				{
		            name:namebox.cost[3],
		            type:'line',
		            smooth: true,
		            symbol:'circle',
	                symbolSize:'6',
	                data:c_fishingCost
				},
				{
		            name:namebox.cost[4],
		            type:'line',
		            smooth: true,
		            symbol:'circle',
	                symbolSize:'6',
	                data:c_buySkin
				},
				{
		            name:namebox.cost[5],
		            type:'line',
		            smooth: true,
		            symbol:'circle',
	                symbolSize:'6',
	                data:c_buySkill
				},
				{
		            name:namebox.cost[6],
		            type:'line',
		            smooth: true,
		            symbol:'circle',
	                symbolSize:'6',
	                data:c_nuclear
				},
				{
		            name:namebox.cost[7],
		            type:'line',
		            smooth: true,
		            symbol:'circle',
	                symbolSize:'6',
	                data:c_active
				},
				{
		            name:namebox.cost[8],
		            type:'line',
		            smooth: true,
		            symbol:'circle',
	                symbolSize:'6',
	                data:c_buyRuby
				},
				{
		            name:namebox.cost[9],
		            type:'line',
		            smooth: true,
		            symbol:'circle',
	                symbolSize:'6',
	                data:c_buyCard
				},
				{
		            name:namebox.cost[10],
		            type:'line',
		            smooth: true,
		            symbol:'circle',
	                symbolSize:'6',
	                data:c_buyVipGift
				},
				{
		            name:namebox.cost[11],
		            type:'line',
		            smooth: true,
		            symbol:'circle',
	                symbolSize:'6',
	                data:c_give
				},
				{
		            name:namebox.cost[12],
		            type:'line',
		            smooth: true,
		            symbol:'circle',
	                symbolSize:'6',
	                data:c_draw
				},
				{
		            name:namebox.cost[13],
		            type:'line',
		            smooth: true,
		            symbol:'circle',
	                symbolSize:'6',
	                data:c_other
				}
				]
			})
	}
}

$(function(){
	// 初始化数据
	$('.s_date').find('input').val(events.get_today());
	// events.$ajax(actions.list_url,{'date':events.get_today()},callback.get_list);
	// 搜索
	$('body').on('click','#search_btn',function(){
		var sday = $('.s_date').find('input').val();
		if(sday){
			events.$ajax(actions.list_url,{'date':sday},callback.get_list);
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
	var input_goods_source = echarts.init(document.getElementById('input_goods_source'));
	var newChart = echarts.init(document.getElementById('goods_source'));
	var option = {
	    title: {
	        // text: '折线图堆叠'
	    },
	    tooltip: {
	        trigger: 'axis'
	    },
	    // legend: {
	    //     data:namebox.input
	    // },
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
 	input_goods_source.setOption(option);