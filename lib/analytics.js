var _ = require('lodash'),
    debug = require('debug')('lib.analytics');

/* having an hash from the source, find the Res/Req associated */
var findResult = function(rrList, hrefHash) {
    return _.find(rrList, function(siteData) {
        return (siteData.fetchInfo.href_hash === hrefHash);
    });
};

/* currently unused */
var fillCompany = function(invertedCompanies, domainDict) {
/* currently unused */
/* currently unused */

    _.each(siteTested.rr, function(inclusion, ndx) {
        var id = inclusion.domain;
        debug("On %s %d", siteTested.file, ndx);
        _.find(invertedCompanies, function(cname, domain) {
            if (_.startsWith(id, domain)) {
                achivements +=1;
                debug("Found %s in %s (%d)", cname, id, achivements);
                siteTested.rr[ndx].company = cname;
                return true;
            }
        });
    });
    /*
    var companyNumber = _.countBy(_.map(newData, function(sb) {
        return sb.contentType;
    }));
     */
    debug("Done %s with %d match", siteTested.file, achivements);
    siteTested.stats.inclusions = achivements;
    return siteTested;
};


var computeInvasiveness = function(datainput) {
    /* take the 'impact' in source, check the number of companies per
        inclusion, generate a new impact called 'invasiveness' */

    return _.reduce(datainput.source, function(memo, siteEntry) {
        var rr = findResult(datainput.data, siteEntry._ls_links[0]._ls_id_hash),
            companiesNumber = _.size(_.keys(rr.stats.companies))

        memo.push({
            'href_hash': siteEntry._ls_links[0]._ls_id_hash,
            'href': siteEntry._ls_links[0].href,
            'nations' : _.reduce(siteEntry.impact, function(m, C) {
                                m.push({
                                    country: C.country,
                                    value: C.countryImpact * companiesNumber
                                });
                                return m;
                            }, [])
        });
        return memo;
    }, []);
};

/* This create a list of the domain name that are frequent across sources but not
 * recognized as Companies. -- TODO refactor in _.reduce */
var sharedUnrecognized = function(pl) {
    var refMap = {};
    _.each(pl.data, function(siteTested) {
        var siteDomains = [];
        _.each(siteTested.rr, function(inclusion) {
            if (inclusion.company === null &&
                siteDomains.indexOf(inclusion.domain) === -1) {
                    siteDomains.push(inclusion.domain);
                }
        });
        refMap[siteTested.fetchInfo.hash] = siteDomains;
    });

    return _.omit(_.transform(refMap, function(result, domainList, siteHash) {
        _.each(domainList, function(domain) {
            if (_.isNumber(result[domain])) {
                result[domain] += 1;
            } else {
                result[domain] = 1;
            }
        })
    }), function(occurrencies, domain) {
        return occurrencies == 1; // do not omit what has != 1 (0 is not present)
    });
};

module.exports = {
    computeInvasiveness: computeInvasiveness,
    sharedUnrecognized: sharedUnrecognized
};

