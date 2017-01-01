
var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('route:getSurface');
var nconf = require('nconf');
 
var mongo = require('../lib/mongo');
var phantomOps = require('../lib/phantomOps');

/* This API return a surface table of the last day scan results, picking from tasks
 * absolved in the last 24 hours, and returning them for DataTable format */
function getSurface(req) {

    var past = moment().subtract(1, 'd').format("YYYY-MM-DD");
    var filterq = { requestTime: { "$gt": new Date(past) } };
    return mongo
        .read(nconf.get('schema').phantom, filterq)
        .then(function(all) {
            var reduction = phantomOps.shrinkMeanings(all);
            debug("after filter %d entry from the last 24 hours, reduced %d",
                _.size(all), _.size(reduction));
            return {
                'json': reduction
            }
        });
};

module.exports = getSurface;
