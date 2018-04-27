/**
 * Created by Administrator on 2017/10/30.
 */

$(function(){
    $('#mainbox').height($(document).height()-80);
    $('.nav-left').height($(document).height()-60);
    $('.contentbox').height($(document).height());
    // pagination();
    // 全选
    $('body').on('change','input[name="selectAll"]',function(){
        var isChecked = this.checked;
           $(this).parent('label').parent('.tree').find('input[type="checkbox"]').each(function (index, element) {
               element.checked = isChecked;
           });
    });
    // 菜单
    $('body').on('click','.nav-link',function(){
        // $(this).parent().addClass('subActive').siblings('li').removeClass('subActive');
        window.location.hash = '#'+$(this).attr('data-href');
    })
    $('body').on('click','.subActive .nav-link',function(){
        window.location.reload();
    })

    // 更改iframe路径
    function load_page(){
       var hash = window.location.hash, page='';
       if (hash == ''){
          page = 'pages/count/basic_data';
       }else{
          page = hash.split('#')[1];
       }
       $('[data-href="'+page+'"]').parent().addClass('subActive').siblings('li').removeClass('subActive');
       $('.nav-left').find('.panel-collapse').removeClass('in').siblings('[role="tab"]').removeClass('navActive');
       $('[data-href="'+page+'"]').parents('.panel-collapse').addClass('in').prev('[role="tab"]').addClass('navActive');
       $('#mainbox').attr('src',page+'.html');
    }
    load_page();
    window.onhashchange = load_page;
})
var events = {
    // ajax_url:'http://192.168.35.220:3802',
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
            '<h4 class="modal-title">'+p_namebox.modal_title+'</h4>'+
            '</div>'+
            '<div class="modal-body">' + title + '</div>'+
            '<div class="modal-footer">'+
            '<a type="button" class="btn greenbtn surebtn" data-dismiss="modal">确定</a>'+
            '</div>'+
            '</div>'+
            '</div>'+
            '</div>';
        var $modal = $('#modal').html(tpl).find('.modal');
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
    // ajax
    $ajax:function(url,params,success,fail,obj){
        if(parent){
            parent.$('#mask').show();
        }
        
        $.ajax({
            // url: 'http://192.168.35.220:3802' + url,
            // url:window.location.origin+url,
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
    setCookie:function(c_name,value,expiredays){
        var exdate=new Date()
        exdate.setDate(exdate.getDate()+expiredays)
        document.cookie=c_name+ "=" +escape(value)+
        ((expiredays==null) ? "" : ";expires="+exdate.toGMTString())
    },
    getCookie:function(c_name){
        if (document.cookie.length>0)
          {
          c_start=document.cookie.indexOf(c_name + "=")
          if (c_start!=-1)
            { 
            c_start=c_start + c_name.length+1 
            c_end=document.cookie.indexOf(";",c_start)
            if (c_end==-1) c_end=document.cookie.length
            return unescape(document.cookie.substring(c_start,c_end))
            } 
          }
        return ""
    }
};

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
