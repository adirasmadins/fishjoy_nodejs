module.exports = {
    GODDESS_LOG: [
        {
            desc: 'goddessLog success - full params',
            params: {
                startDate: '2018-05-01',
                endDate: '2018-05-09',
                start: 1,
                length: 100,
                uid: '70257',
                type: '1,2,3',
            },
        },
        {
            desc: 'goddessLog success - type params',
            params: {
                startDate: '2018-05-01',
                endDate: '2018-05-09',
                start: 1,
                length: 100,
                type: '1,2',
            },
        },
        {
            desc: 'goddessLog success - uid params',
            params: {
                startDate: '2018-05-01',
                endDate: '2018-05-09',
                start: 1,
                length: 100,
                uid: '70257',
            },
        },
        {
            desc: 'goddessLog success - no params',
            params: {
                startDate: '2018-05-01',
                endDate: '2018-05-09',
                start: 1,
                length: 100,
            },
        }
    ]
};