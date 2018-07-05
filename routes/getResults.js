var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('route:getResults');
var moment = require('moment');
var nconf = require('nconf');

var mongo = require('../lib/mongo');
 
function getResults(req) {

    var filter = { campaign: req.params.campaign };

    return mongo
        .read(nconf.get('schema').sites, filter)
        .tap(function(sites) {
            debug("getResults filter %j found %d sites", filter, _.size(sites));
        })
        .map(function(site) {
            /* we should find the last result id */
            if(!site.lastResultId)
                return null;

            return mongo
                .read(nconf.get('schema').results, { id: site.lastResultId })
        }, { concurrency: 1} )
        .then(_.flatten)
        .then(_.compact)
        .then(function(sites) {
            debug("getResults returns: %d", _.size(sites));
            return {
                'json': sites
            }
        });
};

module.exports = getResults;
