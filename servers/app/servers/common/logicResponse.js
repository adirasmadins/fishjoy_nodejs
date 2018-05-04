module.exports = {
    TYPE: {
        DATA: 0,
        EJS: 1,
        REDIRECT: 2,
        FILE: 3,
    },

    ask: function (data, type = 0) {
        return {
            data: data,
            type: type
        };
    },

    askEjs: function (template, data) {
        return {
            data: {
                data:data,
                template: template,
            },
            type: 1
        };
    }
};