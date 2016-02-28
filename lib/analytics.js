var _ = require('lodash'),
    debug = require('debug')('lib.analytics');

/* having an hash from the source, find the Res/Req associated */
var findResult = function(rrList, hrefHash) {
    return _.find(rrList, function(siteData) {
        return ( siteData.fetchInfo !== null &&
                 siteData.fetchInfo.href_hash === hrefHash ) ;
    });
};

var computeIntrusiveness = function(datainput) {
    /* take the 'impact' in source, check the number of companies per
        inclusion, generate a new impact called 'intrusiveness'.
        This is computed by the amount of company for the estimated Impact of the site x country */

    return _.reduce(datainput.source, function(memo, siteEntry) {
        var rr = findResult(datainput.data, siteEntry._ls_links[0]._ls_id_hash);

        if (_.isUndefined(rr) || rr.stats === null) {
            debug("Lacking result/stats of %s", siteEntry._ls_links[0]._ls_id_hash);
            return memo;
        }

        memo.push({
            'href_hash': siteEntry._ls_links[0]._ls_id_hash,
            'href': siteEntry._ls_links[0].href,
            'nations' : _.reduce(siteEntry.impact, function(m, C) {
                                m.push({
                                    country: C.country,
                                    value: C.countryImpact * _.size(_.keys(rr.stats.companies)),
                                    companies: _.size(_.keys(rr.stats.companies))
                                });
                                return m;
                            }, [])
        });
        return memo;
    }, []);
};

/* This create a list of the domain name that are frequent across sources but not
 * recognized as Companies. */
var sharedUnrecognized = function(datainput) {

    var unrec = _.reduce(datainput.data, function(fm, sT) {

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
        return occurrencies == 1;
    });
}

module.exports = {
    findResult: findResult,
    computeIntrusiveness: computeIntrusiveness,
    sharedUnrecognized: sharedUnrecognized
};

