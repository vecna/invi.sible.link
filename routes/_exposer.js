
module.exports = {
    systemInfo:         require('./systemInfo'),
    getRetrieved:       require('./getRetrieved'),
    bySubjectLast:      require('./bySubjectLast'),
    getPage:            require('./getPage'),
    getStats:           require('../lib/daily').byDayStats,
    getSurface:         require('./getSurface')
};
