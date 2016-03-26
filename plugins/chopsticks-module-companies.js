
var _ = require('lodash'),
    debug = require('debug')('plugin.companies'),
    companies = require('../lib/companies');


module.exports = function(staticInput, datainput) {
    var newData = [],
        iCm;

    debug("Processing all the Request/Responses and associate to Companies...");

    iCm = _.reduce(datainput.data, function(memo, siteTested) {
        _.each(siteTested.rr, function(inclusion) {
            if (_.isUndefined(memo[inclusion.domain])) {
                memo[inclusion.domain] = companies.associatedCompany(
                    staticInput.companies, inclusion.domain);
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

        var companiesDict = _.countBy(
            _.filter(
                _.map(siteTested.rr, function(incl) {
                    return incl.company;
                }), undefined));

        siteTested.stats.companies = _.reduce(companiesDict, function(memo, v, k) {
            memo.push({
                'name': k,
                'times': v
            });
            return memo;
        }, []);

        newData.push(siteTested);
    });

    datainput.data = newData

    return datainput;
};

