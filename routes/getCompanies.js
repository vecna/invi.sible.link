
var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('route:getCompanies');
var moment = require('moment');
var nconf = require('nconf');
 
var campaignOps = require('../lib/campaignOps');

/* This API return a reduction of evidences used by c3, it is used to show the sources of third parties */
function getCompanies(req) {

    var filter = { task: req.params.task };
    return campaignOps.pickLastHours(filter, 36)
        .tap(function(a) { debug("size is %d", _.size(a)); })
        .then(campaignOps.keepTheWorstTest)
        .tap(function(a) { debug("size is %d", _.size(a)); })
        .then(campaignOps.rankByTracks)
        .then(function(ranked) {
            return {
                'json': ranked
            }
        });
};

module.exports = getCompanies;
