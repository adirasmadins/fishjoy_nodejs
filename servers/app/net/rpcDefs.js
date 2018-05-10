module.exports = {
    serverType:{
        gate: 'gate',
        loadManager: 'loadManager',
        eventSync: 'eventSync',
        matching: 'matching',
        rankMatch: 'rankMatch',
        game: 'game',
        hall:'hall'
    },
    serverIdKey:{
        gate: 'gateSid',
        loadManager: 'loadManagerSid',
        eventSync: 'eventSyncSid',
        matching: 'matchingSid',
        rankMatch: 'rankMatchSid',
        game: 'gameSid',
        hall:'hallSid'
    },
    serverModule:{
        gate: {},
        loadManager: {
            loadRemote: 'loadRemote'
        },
        eventSync: {},
        matching: {
            matchingRemote: 'matchingRemote'
        },
        rankMatch: {
            rankMatchRemote: 'rankMatchRemote'
        },
        game: {
            playerRemote: 'playerRemote'
        },
        hall: {
            playerLogin: 'playerLogin'
        }
    }
};