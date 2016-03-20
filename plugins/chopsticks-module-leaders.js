var _ = require('lodash'),
    debug = require('debug')('plugin.leaders'),
    lookup = require('../lib/lookup');

/*
 Leaders per country and per category.
    Iterate over all the available staticInput.world,
    check if they has been fetched (in that case, increment presence of belonging)
    append companies presence.
 */

module.exports = function(staticInput, datainput) {

    debug("Extracting the leaders per Category/Country")
    datainput.analytics.leaders = _.reduce(staticInput.world, function(memo, crawledEntry) {

        var siteFetch = lookup.inFetchByInput(datainput, crawledEntry.input_hash);

        if (_.isUndefined(siteFetch))
            return memo;

        _.each(_.pluck(crawledEntry.categories, 'where'), function(category) {
            memo.by_category[category].site_tested += 1;
            _.each(_.keys(siteFetch.stats.companies), function(company) {
                if(_.isUndefined(memo.by_category[category].companies[company]))
                    memo.by_category[category].companies[company] = 1;
                else
                    memo.by_category[category].companies[company] += 1;
            })
        });

        _.each(_.pluck(crawledEntry.countries, 'where'), function(country) {
            memo.by_country[country].site_tested += 1;
            _.each(_.keys(siteFetch.stats.companies), function(company) {
                if(_.isUndefined(memo.by_country[country].companies[company]))
                    memo.by_country[country].companies[company] = 1;
                else
                    memo.by_country[country].companies[company] += 1;
            })
        });

        return memo;
    },
    {
        'by_country': _.reduce(staticInput.lists.countries, function(m, c) {
            m[c] = {
                'site_tested' : 0,
                'companies': {}
            };
            return m;
        }, {}),
        'by_category': _.reduce(staticInput.lists.categories, function(m, c) {
            m[c] = {
                'site_tested' : 0,
                'companies': {}
            };
            return m;
        }, {})
    } );

    return datainput;
};

