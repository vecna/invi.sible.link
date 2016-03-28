var _ = require('lodash'),
    debug = require('debug')('lib.analytics'),
    lookup = require('./lookup');


var sharedUnrecognized = function(datainput) {
/* This create a list of the domain name that are frequent across sources but not
 * recognized as Companies. */
    var IGNORED_THRESHOLD = 3,
        unrec = _.reduce(datainput.data, function(fm, sT) {

        var siteUD = _.reduce(sT.rr, function(memo, inclusion) {
            if (inclusion.company === null && _.isUndefined(memo[inclusion.domain]) ) {
                memo[inclusion.domain] = true;
            }
            return memo;
        }, {});

        _.each(_.keys(siteUD), function(domain) {
            if(_.isUndefined(fm[domain])) {
                fm[domain] = 1;
            } else {
                fm[domain] += 1;
            }
        })
        return fm;
    }, {});

    return _.omit(unrec, function(occurrencies, domain) {
        return _.lte(occurrencies, IGNORED_THRESHOLD);
    });
}

var extractPeeks = function(datainput) {
    /* take the most invasive $PEEK_SIZE site tested, independently from everything other */
    var PEEK_SIZE = 30,
        x = _.reduce(datainput.data, function(memo, sT) {
        if(!_.isUndefined(sT.fetchInfo) && sT.fetchInfo !== null) {
            memo.push({
                companies: _.size(sT.stats.companies),
                js: sT.stats.content['application/javascript'],
                href: sT.fetchInfo.href,
                href_hash: sT.fetchInfo.href_hash
            });
        }
        return memo;
    }, []);

    return _.take( _.sortByOrder(x, ['companies'], ['desc']), PEEK_SIZE);
};


module.exports = {
    sharedUnrecognized: sharedUnrecognized,
    extractPeeks: extractPeeks
};

