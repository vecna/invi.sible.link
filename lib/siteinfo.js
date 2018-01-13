var _ = require('lodash');
var debug = require('debug')('lib:siteinfo');
var Promise = require('bluebird');
var mongo = require('../lib/mongo');
var nconf = require('nconf');

function getJudgment(campaignName, subjectId) {
    return mongo
        .readLimit(nconf.get('schema').judgment, {
            campaign: campaignName
        }, {when: -1}, 1, 0)
        .then(_.first);
};

function getJudgmentAndDetails(subjectId) {
    debug("getJudgmentAndDetails by subjectId: %s", subjectId);
    var filter = { subjectId: subjectId };
    return mongo
        .readLimit(nconf.get('schema').surface, filter, { when: -1 }, 1, 0)
        .then(_.first)
        .then(function(s) {
            debug("Found the subjectId belong to %s, returning judgment+details", s.campaign);
            return Promise.all([s,
                getJudgment(s.campaign, s.subjectId),
                mongo.read(nconf.get('schema').details, {subjectId: s.subjectId})
            ]);
        })
        .then(function(vals) {
            return {
                surface: vals[0],
                judgmentrank: _.find(vals[1].ranks, {subjectId: subjectId }),
                details: vals[2]
            };
        });
};

module.exports = {
    getJudgment: getJudgment,
    getJudgmentAndDetails: getJudgmentAndDetails
};
