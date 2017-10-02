
var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('route:getSurface');
var moment = require('moment');
var nconf = require('nconf');
 
var campaignOps = require('../lib/campaignOps');

/* This API return a surface table of the last day scan results, 
 * picking from tasks absolved in the last $RANGE days, and returning them 
 * for a c3 graph
 */
function getSurface(req) {

    var filter = { campaign: req.params.campaign };
    var RANGE = 2;

    debug("%s getSurface filter %j hours %d",
        req.randomUnicode, filter, RANGE);

    return campaignOps.pickLastHours(filter, RANGE * 24)
        .then(function(surface) {
            /* for every website, if duplicated, keep the one with most */

            debug("Keeping only one entry per site: Starting from %d",
                _.size(surface));
            return _.reduce(surface, function(memo, s) {
                var exists = _.find(memo, { url: s.url });

                // XXX fallo
                if(exists) {
                    if( _.size(exists.companies) > _.size(s.companies) )
                        return memo;
                    memo = _.reject(memo, { url: s.url });
                }
                memo.push(s);
                return memo;
            }, []);
        })
        .then(campaignOps.tableReduction)
        .then(function(reduced) {
            debug("getSurface returns: %d", _.size(reduced));
            return {
                'json': reduced
            }
        });
};

module.exports = getSurface;
