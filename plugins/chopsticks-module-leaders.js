var _ = require('lodash'),
    debug = require('debug')('plugin.ranks'),
    lookup = require('../lib/lookup');

/*
 Leaders per country:
 {
    country: IT,
    tested_site: $Number
    presences: {
        'Google': 80,
        'Facebook': 75,
        'abc': 5
 }
 */

module.exports = function(datainput) {

    debug("Creating a map of the Internet leader by Country");

    var x = _.reduce(datainput.source, function(memo, siteEntry) {
        try {
            var companies = _.keys(lookup
                                 .inFetchInfo(datainput, siteEntry._ls_links[0]._ls_id_hash)
                                 .stats
                                 .companies);
        } catch(error) {
            debug("Missing fetchInfo for %s", siteEntry._ls_links[0].href);
            return memo;
        }

        _.each(siteEntry.visibility, function(sP) {
            memo[sP.country].tested_site += 1;
            _.each(companies, function(c) {
                if (_.isUndefined(memo[sP.country].presence[c])) {
                    memo[sP.country].presence[c] = 1;
                } else {
                    memo[sP.country].presence[c] += 1;
                }
            });
        });
        return memo;
    },
        _.reduce(process.env.WORLD_FILEPREFIX.split(','), function(memo, tlcc) {
            memo[tlcc] = {
                country: tlcc,
                tested_site: 0,
                presence: {}
            }
            return memo;
        }, {})
    );

    datainput.analytics.leaders = _.values(x);
    return datainput;
};

