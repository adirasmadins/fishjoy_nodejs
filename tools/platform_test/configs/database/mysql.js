module.exports = [
    {
        name: 'MysqlConnector1',
        enable: true,
        opts: {
            host: '127.0.0.1',
            // port: 3306,
            // auth: true,
            database: 'fishjoy',
            user: 'root',
            password: 'root',
            // charset: 'utf8',
            // insecureAuth: '',
            connectionLimit: 100,
        }
    },
];