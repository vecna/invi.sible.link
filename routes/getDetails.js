
var _ = require('lodash');
var debug = require('debug')('route:getDetails');
var moment = require('moment');
var nconf = require('nconf');
var mongo = require('../lib/mongo');
 
function getDetails(req) {

    var filter = { campaign: req.params.cname };
    /* can be useful having the number of subject per campaign, and estimate 5-15 entries per site */
    var MAXSITE = 500;

    debug("Looking for %j in .summary", filter);
    return mongo
        .readLimit(nconf.get('schema').details, filter, { acquired: -1 }, MAXSITE, 0)
        .then(function(x) {
            if(!(x && x[0] && x[0].acquired))
                return [];

            var lastDay = moment(x[0].acquired).format('DD');

            return _.filter(x, function(entry) {
                return moment(entry.when).format('DD') == lastDay;
            });
        })
        .then(function(c) {
            debug("returning %d entries", _.size(c));
            return {
                'json': c
            }
        });
};

module.exports = getDetails;
