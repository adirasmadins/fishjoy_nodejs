exports.funcStep = funcStep;

/**
 * 异步执行函数.
 */
function funcStep(funcList, next) {
    if (funcList.length == 0) {
        next();
        return;
    }
    var func_info = funcList.shift();
    var func = func_info.func;
    var params = func_info.params;
    func(params, function() {
        funcStep(funcList, next);
    });
}