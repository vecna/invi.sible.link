
var _ = require('lodash');
var debug = require('debug')('route:getSummary');
var nconf = require('nconf');
var mongo = require('../lib/mongo');
 
function getSummary(req) {

    var filter = { campaign: req.params.cname };

    debug("Looking for %j in .summary", filter);
    return mongo
        .readLimit(nconf.get('schema').summary, filter, { when: -1 }, 1, 0)
        .then(_.first)
        .then(function(c) {
            return {
                'json': c
            }
        });
};

module.exports = getSummary;
