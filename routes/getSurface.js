
var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('route:getSurface');
var moment = require('moment');
var nconf = require('nconf');
 
var campaignOps = require('../lib/campaignOps');

/* This API return a surface table of the last day scan results, picking from tasks
 * absolved in the last 36 hours, and returning them for DataTable format */
function getSurface(req) {

    var filter = { campaign: req.params.campaign };
    var past = 36;

    debug("%s getSurface filter %j hours %d", req.randomUnicode, filter, past);

    return campaignOps.pickLastHours(filter, past)
        .then(campaignOps.tableReduction)
        .then(function(reduced) {
            return {
                'json': reduced
            }
        });
};

module.exports = getSurface;
