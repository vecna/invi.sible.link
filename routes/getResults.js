var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('route:getResults');
var moment = require('moment');
var nconf = require('nconf');

var mongo = require('../lib/mongo');
 
function getResults(req) {

    var filter = { campaign: req.params.campaign };

    debug("getResults filter %j", filter);

    return mongo
        .read(nconf.get('schema').results, filter)
        .then(function(sites) {
            debug("getResults returns: %d", _.size(sites));
            return {
                'json': sites
            }
        });
};

module.exports = getResults;
