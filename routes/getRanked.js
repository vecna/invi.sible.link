
var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('route:getRanked');
var moment = require('moment');
var nconf = require('nconf');
 
var campaignOps = require('../lib/campaignOps');

/* This API return a reduction of evidences used by c3, it is used to show 
 * the sources of third parties */
function getRanked(req) {

    var filter = { campaign: req.params.task };
    debug("getRanked → getEvidences with filter %j on last 24H", filter)
    return campaignOps.getEvidences(filter, 24)
        .then(campaignOps.rankEvidences)
        .then(function(ranked) {
            return {
                'json': ranked
            }
        });
};

module.exports = getRanked;
