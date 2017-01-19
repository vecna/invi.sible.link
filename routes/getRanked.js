
var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('route:getRanked');
var moment = require('moment');
var nconf = require('nconf');
 
var campaignOps = require('../lib/campaignOps');

/* This API return a surface table of the last day scan results, picking from tasks
 * absolved in the last 36 hours, and returning them for DataTable format */
function getRanked(req) {

    var filter = { task: req.params.task };
    return campaignOps.getEvidences(filter)
        .then(campaignOps.rankEvidences)
        .then(function(ranked) {
            return {
                'json': ranked
            }
        });
};

module.exports = getRanked;
