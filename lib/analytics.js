var _ = require('lodash'),
    debug = require('debug')('lib.analytics');

/* I don't know if a better solution here was avaial. I was just looking
   to replace a "." with a special character and vice-versa. This because
   if a assign a key with a "." is considered a PATH of keys by lodash, therefore
   a key "google.com": "evil", becomes "google": { "com": "evil" } */
var _replace = function(str, aim, what) {
    if (str === undefined || str === null) { return undefined; }
    var x;
    do {
        x = str.indexOf(aim);
        if (x !== -1) {
            str = str.substr(0, x ) + what + str.substr(x + 1, str.length -1);
        }
    } while (x !== -1);
    return str;
};

var _reputDot = function(str) { return _replace(str, 'ł', '.'); }
var _awayDot = function(str) { return _replace(str, '.', 'ł'); }

/* currently unused */
var fillCompany = function(invertedCompanies, domainDict) {
    /* invertedCompany contains domain as key, and domainDict contain
       all the unique domain seen, and how many times */

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

var compareImpact = function(pl) {
/* use visibility multiplied per Companies */
    var retMap = {};

    _.each(pl.source, function(siteEntry) {
        var id = _.trunc(siteEntry._ls_links[0]._ls_id_hash, { length: 6, omission: '' });
        retMap[id] = {
            'host': siteEntry._ls_links[0].href,
            'visibility': siteEntry.visibility,
            'companies': [],
        };
    })
    _.each(pl.data, function(siteTested) {
        var id = _.trunc(siteTested.log.hash, { length: 6, omission: ''});
        _.each(siteTested.rr, function(inclusion) {
            if (inclusion.company !== null &&
            (retMap[id].companies.indexOf(inclusion.company) === -1) ) {
                retMap[id].companies.push(inclusion.company);
            }
        });
    });
    _.map(retMap, function(content, id) {
        retMap[id].impact = retMap[id].companies.length * retMap[id].visibility;
    });
    return retMap;
};

/* This create a list of the domain name that are frequent across sources but not
 * recognized as Companies.
 * dict with "repubblicałit": null, "facebookłnet": "Facebook" from all the tests  */
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
        refMap[siteTested.log.hash] = siteDomains;
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
    compareImpact: compareImpact,
    sharedUnrecognized: sharedUnrecognized,
    _awayDot: _awayDot,
    _reputDot: _reputDot
};

