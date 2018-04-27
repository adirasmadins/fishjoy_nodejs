// 接口
var actions = {
	'login':'/admin/login'
}
// 回调
var callback = {
	login_fn:function(){
		var account = $('#account').val(),pasd = $('#pasd').val(),langselect = $('.langselect').val();
		if(account && pasd){
			events.$ajax(actions.login,{'username':account, 'password':pasd,'i18n':langselect},callback.back_login);
		}else{
			events.myalert(namebox.alertTip);
		}
	},
	back_login:function(data){
		console.log(data)
		if(data.data.result == true){
			window.location.href = 'index.html'+window.location.search;
			events.setCookie('lang',$('.langselect').val(),30);
			events.setCookie('account',$('#account').val(),30);
			// var lang = events.getCookie('lang');
			// var account = events.getCookie('account');
		}else{
			events.myalert(data.data.err);
		}
	},
	langchoose:function(val){
		var account_name = $('#account_name');
		var pasd_name = $('#pasd_name');
		var login_btn = $('.login-btn')
		switch (val){
			case 'en_US':
						account_name.html('Account') ;
						pasd_name.html('Password');
						login_btn.html('Sign in');
						break;
			case 'vi_VN':
						account_name.html('Số tài khoản.');
						pasd_name.html('Mật mã.');
						login_btn.html('Đăng nhập');
						break;
			case 'zh_CN':account_name.html('账号');
						pasd_name.html('密码');
						login_btn.html('登 录');
						break;
		}
	}
}

$(function(){
	console.log(events.getCookie('lang'));
	var cookie_lang = events.getCookie('lang');
	if(cookie_lang){
		$('.langselect').val(cookie_lang);
	}
	// 语言选择
	callback.langchoose($('.langselect').val())
	$('body').on('change','.langselect',function(){
		var val = $(this).val();
		callback.langchoose(val);
	});

	$('body').on('click','.login-btn',function(){
		callback.login_fn();
	});
	var lang = window.location.search;var lang_type = lang.split('?lang=').slice(0).join('');
	if(lang_type == 'zh_CN'){

	}else{
		$('#zh_CN').remove()
	}
})
$(document).keydown(function(event){ 
    if(event.keyCode==13){ 
        callback.login_fn();
    } 
});
