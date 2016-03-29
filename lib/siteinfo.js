var _ = require('lodash'),
    debug = require('debug')('↻ maître'),
    lookup = require('./lookup'),
    mongodb = require('./mongodb');

var extendedSites = function(staticInput, siteT, numberOf) {

    var topSites = _.take(_.sortByOrder(siteT, function(sT) {
            return _.size(sT.stats.companies);
        }, ['desc']), numberOf);

    return _.map(topSites, function(sE) {
        var siteInfo = lookup.inStatic(staticInput, sE.input_hash);
        return _.extend(siteInfo, 
        {
            companies: sE.stats.companies,
            specific_list: _.pluck(sE.hashes, 'specific'),
            blurred_list: _.pluck(sE.hashes, 'blurred')
        });
    });
};


var surfaceSiteInfo = function(staticInput, siteT, howmany) {
    var sites = extendedSites(staticInput, siteT, howmany);
    return _.map(sites, function(site) {
        return _.omit(site, ['specific_list', 'blurred_list'])
    });
};

var detailSiteInfo = function(staticInput, siteT) {

    var sites = extendedSites(staticInput, siteT, 10),
        specificHashL = _.keys(_.reduce(sites, function(memo, eS) {
            _.each(eS.specific_list, function(sphash) {
                memo[sphash] = true;
            });
            return memo;
        }, {})),
        query = { _specific_hash : { $in : specificHashL } };

    return mongodb
        .find('units', query)
        .then(function(results) {
            /* merge the units again with the extendedSites */
            return _.map(sites, function(site) {
                var incl = _.map(site.specific_list, function(ash) {
                    return _.omit(
                        _.findWhere(results, { '_specific_hash':  ash }),
                        ['_specific_hash', '_blurred_hash', 'bodySize', '_id']
                    );
                }),
                    retVal = _.omit(site, ['_id']);
                retVal.inclusion = incl;
                return retVal;
            });
        });
};

var padder = function(withwhat, tohowmuch) {
    for (var i = _.size(withwhat); i < tohowmuch; i++) {
        withwhat = withwhat + " ";
    }
    return withwhat;
};

var cliVisual = function(simpleResults) {
    /* This is just a simple dumb visualisation for the console CLI */
    var stdoutnfo = _.map(simpleResults, function(sr, counter) {
        var name = sr.href,
            rank = _.reduce(sr.categories, function(memo, co) {
                memo += co.where + "[" + co.rank + "] ";
                return memo;
            }, ""),
            trackers = "trackers: " + _.size(sr.companies);

        /* TODO improve with
            https://www.npmjs.com/package/pretty-print
            https://www.npmjs.com/package/cli-color
            https://github.com/flatiron/cliff
         */
        return {
            counter: "⚟ " + (counter + 1),
            name: 'http://' + name,
            trackers: trackers,
            rank: rank
        }
    }),
      maxurl = _.size(_.max(stdoutnfo, function(nfo) {
          return _.size(nfo.name);
      }).name) + 3;

    _.each(stdoutnfo, function(nfo) {
        console.log(
            padder(nfo.counter, 6) +
            padder(nfo.name, maxurl) +
            padder(nfo.trackers, 20) +
            nfo.rank 
        );
    });
};

module.exports = {
    surfaceSiteInfo: surfaceSiteInfo,
    detailSiteInfo: detailSiteInfo,
    extentedSites: extendedSites,
    cliVisual: cliVisual
};
