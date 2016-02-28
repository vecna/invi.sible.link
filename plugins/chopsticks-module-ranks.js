var _ = require('lodash'),
    debug = require('debug')('plugin.ranks'),
    analytics = require('../lib/analytics');

module.exports = function(datainput) {

    if (_.isUndefined(datainput.analytics.intrusiveness)) {
        throw new Error("Requirement: ranks plugin has to be called after analysis!");
    }

    debug("Iterating over Invasiveness rank to get the top %d per country", process.env.RANKS_SIZE);
    var byCi = _.reduce(datainput.analytics.intrusiveness, function(memo, siteIntr) {
        _.each(siteIntr.nations, function(countryIntr) {
            if(_.isUndefined(memo[countryIntr.country])) {
                memo[countryIntr.country] = [];
            }
            memo[countryIntr.country].push({
                'value': countryIntr.value,
                'href': siteIntr.href,
                'href_hash': siteIntr.href_hash,
                'debug': countryIntr.debug
            });
        });
        return memo;
    }, {});

    datainput.analytics.ranks =
    _.reduce(byCi, function(memo, siteList, tlcc) {
        memo[tlcc] = _.take(
                _.map(_.sortByOrder(siteList, ['value'], ['desc'])),
                process.env.RANKS_SIZE);
        return memo;
    }, {} );

    return datainput;
};

module.exports.argv = {
    'ranks.size': {
        nargs: 1,
        default: 10,
        desc: 'amount of "most intrusive" website per country'
    }
}