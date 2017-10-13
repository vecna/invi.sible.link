
var _ = require('lodash');
var debug = require('debug')('route:getSummary');
var moment = require('moment');
var nconf = require('nconf');
var mongo = require('../lib/mongo');
 
function getSummary(req) {

    var filter = { campaign: req.params.cname };
    var MAXENTRY = 2;

    debug("Looking for %j in .summary", filter);
    return mongo
        .readLimit(nconf.get('schema').summary, filter, { when: -1 }, MAXENTRY, 0)
        .then(function(x) {
            var lastDay = moment(x[0].when).format('DD');
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

module.exports = getSummary;

// test iniziato alle 8:17

