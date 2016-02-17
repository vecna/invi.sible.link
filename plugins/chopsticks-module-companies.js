var _ = require('lodash'),
    Promise = require('bluebird'),
    debug = require('debug')('plugin.companies'),
    moment = require('moment'),
    fs = require('fs'),
    analytics = require('../lib/analytics');

Promise.promisifyAll(fs);

module.exports = function(datainput) {

    /* A single key for every domain in datainput. */
    var invertedCompany = {},
        newData = [],
        domainMap = {};

    _.each(datainput.companies, function(compadomains, cname) {
        _.each(compadomains, function(domain) {
            _.set(invertedCompany,
                analytics._awayDot(domain),
                analytics._awayDot(cname)
            );
        });
    });

    debug("From companies list of %d a mapped %d",
        _.size(datainput.companies), _.size(invertedCompany));

    _.each(datainput.data, function(siteTested) {
        _.each(siteTested.rr, function(inclusion) {
            _.set(domainMap, analytics._awayDot(inclusion.domain), null);
        });
    });

    debug("Reduced domain map from %d sites to %d domains",
        _.size(datainput.data), _.size(domainMap));

    _.each(domainMap, function(_null, domainKey) {
        _.find(invertedCompany, function(cname, cdomain) {
            if (_.startsWith(domainKey, cdomain) || _.endsWith(domainKey, cdomain)) {
                // debug("Found %s in %s", cname, domainKey);
                domainMap[domainKey] = analytics._reputDot(cname);
                return true;
            }
        });
    });

    debug("Mapped companies per unique domain included (%d)", _.size(domainMap) );
    _.each(datainput.data, function(siteTested) {

        _.each(siteTested.rr, function(inclusion, ndx, sT) {
            var kd = analytics._awayDot(inclusion.domain);
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

    return datainput;
};

module.exports.argv = {
    'companies.shared': {
        nargs: 1,
        default: 1,
        desc: 'do analysis of shared inclusion in the dataset (companies or domains).'
    }
};
