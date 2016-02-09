
var _ = require('lodash'),
    Promise = require('bluebird'),
    debug = require('debug')('plugin.companies'),
    moment = require('moment'),
    fs = require('fs'),
    companies = require('../lib/companies');

Promise.promisifyAll(fs);

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


module.exports = function(datainput) {

    /* A single key for every domain in datainput. */
    var invertedCompany = {},
        newData = [],
        domainMap = {};

    _.each(datainput.companies, function(compadomains, cname) {
        _.each(compadomains, function(domain) {
            _.set(invertedCompany,
                _replace(domain, '.', 'ł'),
                _replace(cname, '.', 'ł'));
        });
    });

    debug("From companies list of %d a mapped %d",
        _.size(datainput.companies), _.size(invertedCompany));

    _.each(datainput.data, function(siteTested) {
        _.each(siteTested.rr, function(inclusion) {
            _.set(domainMap, _replace(inclusion.domain, '.', 'ł'), null);
        });
    });

    debug("Reduced domain map from %d sites to %d domains",
        _.size(datainput.data), _.size(domainMap));

    _.each(domainMap, function(_null, domainKey) {
        _.find(invertedCompany, function(cname, domain) {
            if (_.startsWith(domainKey, domain)) {
                // debug("Found %s in %s", cname, domainKey);
                domainMap[domainKey] = _replace(cname, 'ł', '.');
                return true;
            }
        });
    });

    debug("Mapped companies per unique domain included (%d)", _.size(domainMap) );
    _.each(datainput.data, function(siteTested) {

        _.each(siteTested.rr, function(inclusion, ndx, sT) {
            var kd = _replace(inclusion.domain, '.', 'ł');
            sT[ndx].company = domainMap[kd];
        });

        siteTested.stats.companies = _.countBy(
            _.filter(
                _.map(siteTested.rr, function(incl) {
                    return incl.company;
                }), undefined));

        newData.push(siteTested);
    });
    datainput.data = newData;

    if (process.env.COMPANIES_SHARED === 1) {
        datainput.analytics.shared = companies.sharedAnalytics();
    }

    return datainput;
};

module.exports.argv = {
    'companies.shared': {
        nargs: 1,
        default: 1,
        desc: 'do analysis of shared inclusion in the dataset.'
    }
};
