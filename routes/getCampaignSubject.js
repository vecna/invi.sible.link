
var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('route:getCampaignSubject');
var nconf = require('nconf');
 
var mongo = require('../lib/mongo');
var subjectsOps = require('../lib/subjectsOps');

/* This API return a surface table of the last day scan results, picking from tasks
 * absolved in the last 24 hours, and returning them for DataTable format */
function getCampaignSubject(req) {

    if (_.size(req.params.cname) === 2)
        var filter = { iso3166 : req.params.cname };
    else
        var filter = { name: req.params.cname };

    debug("Looking for campaign %s %j", req.params.cname, filter);
    return mongo
        .read(nconf.get('schema').subjects, filter)
        .then(function(all) {
            var clean = _.map(all[0].pages, function(e) {
                return _.extend(e, {
                    creationTime: all[0].creationTime,
                    population: all[0].population
                }); 
            });
            debug("GetCampaignSubject with %d pages keys avail %j",
                _.size(all[0].pages), _.keys(clean[0]));

            var genericInfo = _.omit(all[0], ["_id","pages"]);

            var tablized = _.map(clean, function(e) {
                return [ e.href, e.description, e.rank ];
            });
            debug("returning %j + %d of %j",
                genericInfo, _.size(tablized), _.first(tablized));
            return {
                'json': {
                    'info': genericInfo,
                    'table': tablized
                }
            }
        });
};

module.exports = getCampaignSubject;
