module.exports = [
    {
        name: 'RedisConnector1',
        enable: true,
        opts: {
            host: '127.0.0.1',
            port: 6379,
            db: 0,
            prefix: '',
            auth: true,
            password: 'pwd'
        }
    },
];