
module.exports = {
    systemInfo:            require('./systemInfo'),
    getSubjectsStats:      require('./getSubjectsStats'),
    getPage:               require('./getPage'),
    getStats:              require('./getStats'),
    getCampaignSubject:    require('./getCampaignSubject'),
    getCampaignNames:      require('./getCampaignNames'),
    getSurface:            require('./getSurface'),
    getEvidencesExtended:  require('./getEvidencesExtended'),
    getSummary:            require('./getSummary'),
    getDetails:            require('./getDetails'),
    getCSV:                require('./getCSV'),
    activeTasks:           require('./activeTasks'),
    getRaw:                require('./getRaw'),
    getTableauJSON:	       require('./getTableauJSON'),
    getCheckURL:           require('./getCheckURL'),
    getMixed:              require('./getMixed'),
    getJudgment:           require('./getJudgment'),
    getSiteInfo:           require('./getSiteInfo'),

    serveCampaign:         require('./serveCampaign'),
    serveSite:             require('./serveSite'),

    getRecentActivities:   require('./getRecentActivities'),
    getEvidencesByHref:    require('./getEvidencesByHref')
};
