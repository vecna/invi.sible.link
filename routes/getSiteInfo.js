var _ = require('lodash');
var debug = require('debug')('route:getSiteInfo');
var Promise = require('bluebird');
var mongo = require('../lib/mongo');
var nconf = require('nconf');
var siteinfo = require('../lib/siteinfo');

function getSiteInfo(req) {
   
    var subjectId = /^[a-fA-F0-9]+$/.exec(req.params.subjectId);
    if(!_.size(subjectId[0]) === 40)
        throw new Error("Wrong input, expected something looking like a sha256 output");

    subjectId = subjectId[0]; 

    debug("Fetching siteinfo by %s", subjectId);

    return siteinfo
        .getJudgmentAndDetails(subjectId)
        .then(function(v) {
            return {
                json: {
                    judgmentrank: v.judgmentrank,
                    details: v.details,
                    surface: v.surface
                }
            };
        });
};

module.exports = getSiteInfo;
