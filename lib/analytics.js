var _ = require('lodash'),
    debug = require('debug')('lib.analytics'),
    lookup = require('./lookup');

var computeIntrusiveness = function(datainput) {
    /*  Take the 'visibility' in source, check the number of companies per
        inclusion, generate a new data called 'intrusiveness'.
        This is computed by the amount of company for the estimated Impact of the site x country.

    The parameters to be used are matter of research, they are fill up in init.js look for
    memo[key].visibility and there is a list of parameters collect by Alexa (at the momoment, but
    they display many many limits).
      */

    return _.reduce(datainput.source, function(memo, siteEntry) {
        var rr = lookup.inFetchInfo(datainput, siteEntry._ls_links[0]._ls_id_hash);

        if (_.isUndefined(rr) || rr.stats === null) {
            debug("Lacking result/stats of %s", siteEntry._ls_links[0].href);
            return memo;
        }
        memo.push({
            'href_hash': siteEntry._ls_links[0]._ls_id_hash,
            'href': siteEntry._ls_links[0].href,
            'nations' : _.reduce(siteEntry.visibility, function(m, C) {
                                m.push({
                                    country: C.country,
                                    popularity: C.nationalPrcnt + "%",
                                    value: C.pvPU * (100 - C.nationalRank) * _.size(_.keys(rr.stats.companies)),
                                    companies: _.size(_.keys(rr.stats.companies)),
                                    debug: "pvPU " + C.pvPU + " nR " + C.nationalRank + " C " + _.size(_.keys(rr.stats.companies))
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

var extractPeeks = function(datainput) {
/* take the most invasive 30 website tested, independently from the visibility/impact */

    var x = _.reduce(datainput.data, function(memo, sT) {
        if(!_.isUndefined(sT.fetchInfo) && sT.fetchInfo !== null) {
            memo.push({
                companies: _.size(_.keys(sT.stats.companies)),
                js: sT.stats.content['application/javascript'],
                href: sT.fetchInfo.href,
                href_hash: sT.fetchInfo.href_hash
            });
        }
        return memo;
    }, []);

    return _.take( _.sortByOrder(x, ['companies'], ['desc']), 30);

};


module.exports = {
    computeIntrusiveness: computeIntrusiveness,
    sharedUnrecognized: sharedUnrecognized,
    extractPeeks: extractPeeks
};

