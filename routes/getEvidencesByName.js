
var _ = require('lodash');
var debug = require('debug')('route:getEvidencesByName');
var moment = require('moment');
var nconf = require('nconf');
 
var campaignOps = require('../lib/campaignOps');

/* This API return a surface table of the last day scan results, picking from tasks
 * absolved in the last 36 hours, and returning them for DataTable format */
function getEvidencesByName(req) {

    var filter = { domaindottld: req.params.sitename };
    var past = 24 * 5;

    debug("%s getEvidencesByName filter %j hours %d", req.randomUnicode, filter, past);

    return campaignOps.getEvidences(filter, past)
        .then(function(m) {

            var p = _.first(m).promiseId;
            debug("Taking in account evidences since %s", _.first(m).when);
            var promiseFilter = { promiseId: p };
            return campaignOps.getEvidences(promiseFilter, past);
        })
        .then(function(clean) {
            return _.reject(clean, function(o) {
                return _.startsWith(o.url, 'data:');
            });
        })
        .map(campaignOps.smallEvidences)
        .then(function(reduced) {
            debug("getEvidencesByName returns: %d", _.size(reduced));
            return {
                'json': reduced
            }
        });
};

module.exports = getEvidencesByName;
