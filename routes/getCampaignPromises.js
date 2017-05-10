
var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('route:getCampaignPromises');

var nconf = require('nconf');
var mongo = require('../lib/mongo');

/* This API return a surface table of the last day scan results, picking from tasks
 * absolved in the last 24 hours, and returning them for DataTable format */
function getCampaignPromises(req) {

    var filter = { taskName: req.params.cname };

    debug("Looking for campaign in %s %j", req.params.cname, filter);

    // fuck the nconf.get('schema').subjects
    return mongo
        .readLimit('promises', filter, {start: 1}, 100, 0)
        .then(function(all) {
            /* in theory can be cleaned, returning only the last block */
            debug("¹ %s", JSON.stringify(all[0], undefined, 2));
            debug("last %s", JSON.stringify(all[99], undefined, 2));
            return {
                'json': all
            }
        });
};

module.exports = getCampaignPromises;
