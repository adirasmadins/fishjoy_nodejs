/**
 * Created by Administrator on 2017/10/30.
 */
$(function(){
    // pagination();


})
var events = {
    // ajax_url:'http://192.168.35.220:3802',
    get_today:function(){
        // 获取当前日期
        var myDate = new Date();
        var n = (myDate.getMonth() + 1)<10 ? '0'+(myDate.getMonth() + 1) : (myDate.getMonth() + 1);
        var d = myDate.getDate()<10 ? '0'+myDate.getDate() : myDate.getDate();
        var get_today = myDate.getFullYear()+'-'+n+'-'+d;
        return get_today;
    },
    // 获取前n天的日期
    get_before:function(nday){
        console.log(nday)
        var date1 = new Date();
        var date2 = new Date(date1);
        date2.setDate(date1.getDate() - nday);
        var n = (date2.getMonth() + 1) <10 ? '0'+(date2.getMonth() + 1) : (date2.getMonth() + 1);
        var d = date2.getDate() <10 ? '0'+date2.getDate() : date2.getDate();
        // console.log(date2.getFullYear() + "-" + (date2.getMonth() + 1) + "-" + date2.getDate() + "-"+ date2.getDay());
        var get_30before = date2.getFullYear()+'-'+n+'-'+d;
        return get_30before;
    },
    // 修改
    eidtchange:function(obj,fn,data){
        obj.toggleClass('active');
        var input = obj.parents('.edit-mainbox').find('.eidt-input');
        if(obj.hasClass('eidts-btny')){
            if(obj.hasClass('active')){
                input.removeAttr('disabled');
                input[0].focus();
                obj.html(namebox.btnsure).addClass('btn-success').removeClass('btn-warning');
            }else{
                input.attr('disabled');
                obj.html(namebox.btnedit).addClass('btn-warning').removeClass('btn-success');
                if(fn){fn(data) || fn}
            }
        }else{
          if(obj.hasClass('active')){
              input.removeClass('hide');
              input[0].focus();
              obj.html(namebox.btnsure).addClass('btn-success').removeClass('btn-warning');
          }else{
              input.addClass('hide');
              obj.html(namebox.btnedit).addClass('btn-warning').removeClass('btn-success');
              if(fn){fn(data) || fn}
          }  
        }

    },
    //回到顶部
    backTop:function(){
        if($(document).scrollTop()>200){
            $("html,body").animate({scrollTop: 0}, 300);
            return false;
        }
    },
    //提示框
    myalert:function(title,callbackbtn,callback){
        var tpl = '<div class="modal fade mymodal" id="email-tip" tabindex="-1" role="dialog" aria-labelledby="myModalLabel">'+
            '<div class="modal-dialog ft18 " role="document">'+
            '<div class="modal-content over-hidden">'+
            '<div class="modal-header">'+
            '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true" class="fff">&times;</span></button>'+
            '<h4 class="modal-title">'+parent.p_namebox.modal_title+'</h4>'+
            '</div>'+
            '<div class="modal-body">' + title + '</div>'+
            '<div class="modal-footer">'+
            '<a type="button" class="btn greenbtn surebtn" data-dismiss="modal">'+parent.p_namebox.modal_sure+'</a>'+
            '</div>'+
            '</div>'+
            '</div>'+
            '</div>';
        var $modal = parent.$("#modal").html(tpl).find('.modal');
        $modal.modal('show');
        var $backdropHide = $('.modal-backdrop:last').siblings('.modal-backdrop');
        $backdropHide.fadeOut(300);
        var setTime;
        clearTimeout(setTime);
        setTime = setTimeout(function(){
            $backdropHide.remove();
        },300);
        $modal.on('click','.surebtn[data-dismiss="modal"]',function(event){
            if(callbackbtn){
                callbackbtn($modal, event);
            }
        });
        $modal.one('click', '[data-btn="confirm"]', function(event){
            if(callback) callback($modal, event);
        });
    },
    // 点击分页按钮
    clickPage:function(obj){
        var startpage = obj.attr('data-page');
        obj.parent('li').addClass('active').siblings('li').removeClass('active');
        var sday = $('#search_btn').attr('data-sday');
        var eday = $('#search_btn').attr('data-eday');
        var uids = $('#search_btn').attr('data-uid');
        $('.s_date').find('input').val(sday);
        $('.e_date').find('input').val(eday);
        $('#uid_box').val(uids);
        return {'startpage':startpage,'sday':sday,'eday':eday}
        // if(callback){callback() || callback}
    },
    // ajax
    $ajax:function(url,params,success,fail,obj){
        if(parent){
            parent.$('#mask').show();
        }
        $.ajax({
            // url: 'http://192.168.35.220:3802' + url,
            url:url,
            async: true,
            type: 'POST',
            dataType: 'json',
            xhrFields: { withCredentials: true },
            crossDomain: true,
            data: { data: params },
            success: function(data){
                console.log(data);
                if(parent){
                   parent.$('#mask').hide();
                }
                if(success){
                   success(data,params? params : '',obj ? obj :'') || success ;
                }
            },
            error:fail
        });
    },
    // get
    $get:function(url,success,fail){
        $.ajax({  
            url:url,  
            type:"GET",  
            dataType:"html",  
            success:function(result){  
             success(result)|| success;
            }  
        });
    }
};

/*获取选中的值*/ 
function getSelect(box) {
    var values = [];
    box.find('input[type="checkbox"]:checked').each(function () {
        var id = $(this).val();
        if(id||id==0) values.push(id);
    });
    return values;
};
// 分页
function pagination(nowpage,pagecount,rows,container){
    // var pagecount = pagecount ? pagecount : parseInt($('#pagecount').val());
    // var nowpage = nowpage ? nowpage : parseInt($('#nowpage').val()) ;
    if($('#pages')){$('#pages').html(pagecount);}
    if($('#rows')){$('#rows').html(rows);}
    // var pageurl = $('#pageurl').val();
    var $container = container ? container : $('ul.pagination');
    if(pagecount > 1){
        $container.html('');
        var prev = nowpage-1<1?nowpage:nowpage-1;
        var next = nowpage+1>pagecount?pagecount:nowpage+1;
        var if_prev = nowpage-1<1?'disabled':'';
        var if_next = pagecount - nowpage<1?'disabled':'';
        var page_html = [];
        page_html.push('<li class="'+if_prev+'"><a data-page="1">'+parent.p_namebox.firstpage+'</a></li>');
        page_html.push('<li class="'+if_prev+'"><a data-page="'+prev+'" aria-label="Previous"> <span aria-hidden="true">'+parent.p_namebox.prevpage+'</span> </a></li>');
       if(pagecount >10){
            if(nowpage >4){
                page_html.push('<li><a data-page="1" class="able-btn">1</a></li>');
                page_html.push('<li><a data-page="2" class="able-btn">2</a></li>');
                page_html.push('<li><span>...</span></li>');

                var start = parseInt(nowpage)-2, end = parseInt(nowpage)+2;
                end = end>pagecount?pagecount:end;
                for(var i=start; i<=end; i++){
                    page_html.push('<li><a data-page="'+i+'" class="able-btn">'+i+'</a></li>');
                }
            }else{
                for(var i=1; i<=5; i++){
                    page_html.push('<li><a data-page="'+i+'" class="able-btn">'+i+'</a></li>');
                }
            }

            if(nowpage < pagecount-5){
                // page_html.splice(4, 1);
                page_html.push('<li><span>...</span></li>');
                page_html.push('<li><a href="'+pageurl+pagecount+'" data-page="'+pagecount+'">'+pagecount+'</a></li>');
            }else{
                var start = nowpage + 3, end = pagecount;
                start = start > pagecount?start:pagecount;
                for(var i=start; i<=end; i++){
                    page_html.push('<li><a data-page="'+i+'"class="able-btn">'+i+'</a></li>');
                }
            }

       }else{
            for(var i=1; i<=pagecount; i++){
                page_html.push('<li><a data-page="'+i+'" class="able-btn">'+i+'</a></li>');
            }
        }
        page_html.push('<li class="'+if_next+'"><a data-page="'+next+'" aria-label="Next"><span aria-hidden="true">'+parent.p_namebox.nextpage+'</span></a></li>');
        page_html.push('<li class="'+if_next+'"><a data-page="'+pagecount+'">'+parent.p_namebox.endpage+'</a><li class="total-num">'+parent.p_namebox.totalpage+':'+pagecount+'</li></li>');

        $container.html(page_html);
        $container.find('.able-btn[data-page="'+nowpage+'"]').parent().addClass('active');
        $container.find('.able-btn[data-page="'+nowpage+'"][aria-label]').hide();
     }else{
        $container.html('');
     }
}

// 输入字数限制
function textCounter(obj,maxlimit,countobj) {  
// 函数，3个参数，表单名字，表单域元素名，限制字符；  
        var obj = $(obj);
        var countobj = $(countobj);
        var obj_value = obj.val().trim();
    if (obj_value.length > maxlimit){
        obj.val(obj_value.substr(0, maxlimit));  
    }else{
        if(countobj){
            countobj.val(maxlimit - obj.val().length); 
        }else{return;}
    } 
} 
