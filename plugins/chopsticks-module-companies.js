
var _ = require('lodash'),
    Promise = require('bluebird'),
    debug = require('debug')('plugin.companies'),
    moment = require('moment'),
    fs = require('fs'),
    linkIdHash = require('../lib/transformer').linkIdHash,
    domainTLDinfo = require('../lib/domain').domainTLDinfo,
    company = require('../lib/companies'),
    directoryStruct = require('../lib/jsonfiles').directoryStruct;

var _replace = function(str, aim, what) {
    var x;
    if (str === undefined || str === null) {
        return undefined;
    }

    do {
        x = str.indexOf(aim);
        if (x !== -1) {
            str = str.substr(0, x ) + what + str.substr(x + 1, str.length -1);
        }
    }
    while (x !== -1);
    return str;
};

Promise.promisifyAll(fs);

module.exports = function(datainput) {

    /* A single key for every domain in datainput. */
    var invertedCompany = {},
        newData = [],
        domainMap = {};

    _.each(datainput.companies, function(compadomains, cname) {
        debugger;
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

    debug("mapped companies per unique domain included");

    _.each(datainput.data, function(siteTested) {

        _.each(siteTested.rr, function(inclusion, ndx, sT) {
            var kd = _replace(inclusion.domain, '.', 'ł');
            sT[ndx].company = domainMap[kd];
        });

        var companyNumber = _.countBy(_.filter(_.map(siteTested.rr, function(incl) {
            return incl.company;
        }), undefined));

        siteTested.stats.companies = companyNumber;
        newData.push(siteTested);
    });

    datainput.data = newData;

    return fs
        .writeFileAsync("/tmp/FINALE.json", JSON.stringify(datainput, undefined, 2))
        .return(datainput);
};

