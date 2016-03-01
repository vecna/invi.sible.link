var _ = require('lodash'),
    Promise = require('bluebird'),
    debug = require('debug')('plugin.companies'),
    moment = require('moment'),
    fs = require('fs'),
    analytics = require('../lib/analytics'),
    companies = require('../lib/companies');

Promise.promisifyAll(fs);

module.exports = function(datainput) {
    var newData = [],
        iCm;

    debug("Processing all the Request/Responses and associate to Companies...");

    iCm = _.reduce(datainput.data, function(memo, siteTested) {
        _.each(siteTested.rr, function(inclusion) {
            if (_.isUndefined(memo[inclusion.domain])) {
                memo[inclusion.domain] = companies.associatedCompany(
                    datainput.companies, inclusion.domain);
            }
        });
        return memo
    }, {});

    debug("Reduced Request/Response list from %d entries to %d inclusions",
        _.size(datainput.data), _.size(iCm));

    _.each(datainput.data, function(siteTested) {

        /* Instead of this 'each', can be a reduce and removed all the target site details? */
        _.each(siteTested.rr, function(inclusion, ndx, sT) {
            sT[ndx].company = iCm[inclusion.domain];
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