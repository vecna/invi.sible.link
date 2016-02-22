var _ = require('lodash'),
    Promise = require('bluebird'),
    jsonReader = require('./jsonfiles').jsonReader;
    debug = require('debug')('lib.confinput'),
    moment = require('moment'),
    analytics = require('../lib/analytics'),
    path = require('path'),
    fs = require('fs');

Promise.promisifyAll(fs);

/* load all the URL source files defined in the config. read a country
   JSON file and many URLs file */

var readCountriesURLs = function(configContent, countriesInfo) {

    return Promise.map(configContent.world.filePrefix, function(tlc) {

        return jsonReader(path.join(configContent.world.locationDir, tlc + '.json'))
            .then(function(countryURLsContent) {
                return _.map(countryURLsContent, function(siteEntry) {

                    if ( _.parseInt(siteEntry.nationalReach[0]["aws:PerMillion"])  > (1000 * 1000) ) {
                        debug("Wtf in %s for %s", tlc, siteEntry.href);
                    }
                    // https://forums.aws.amazon.com/message.jspa?messageID=265890
                    var reach = _.parseInt(siteEntry.nationalReach[0]["aws:PerMillion"]),
                        siteImpact = reach * ( countriesInfo[tlc].ppl / 1000 * 1000) ;

                    // debug("National site impact of %s in %s is %d", siteEntry.href, tlc, siteImpact);
                    // Unued data:
                    // _.parseInt(siteEntry.nationalPV[0]["aws:PerUser"]) );
                    // _.parseInt(siteEntry.nationalPV[0]["aws:PerMillion"]);

                    return {
                        country: tlc,
                        href: siteEntry.href,
                        nationalRank: siteEntry.nationalRank,
                        globalRank: siteEntry.globalRank,
                        countryImpact: siteImpact,
                        reach: reach,
                        ppl: countriesInfo[tlc].ppl
                    }
                });
            })
    });
};

var confsource = function(configFile) {

    var retD = { config: null, source: null, companies: null };


    return jsonReader(configFile)
        .then(function(configContent) {
            retD.config = configContent;
            return jsonReader(retD.config.world.countries)
                .then(function(countryInfo) {

                    return _.reduce(countryInfo, function(memo, elem) {
                        memo[elem.codes.substr(0, 2)] = {
                            name: elem.country,
                            ppl: elem.ppl
                        };
                        return memo;
                    }, {});
                })
                .then(function(worldCountries) {
                    return readCountriesURLs(retD.config, worldCountries);
                })
                .tap(function(siteMatrix) {
                    retD.source = siteMatrix;
                });
        })
        .then(function() {
            return jsonReader(retD.config.companies)
                .tap(function(companiesInfo) {
                    retD.companies = companiesInfo;
                });
        })
        .tap(function() {
            retD.source = _.reduce(retD.source, function(memo, countryList) {
                _.each(countryList, function(siteEntry) {
                    var domain = analytics.awayDot(siteEntry.href);
                    if (memo[domain] === undefined) {
                        memo[domain] = {
                            when: moment().format('YYMMDD'),
                            globalRank: siteEntry.globalRank,
                            _ls_links: [{
                                href: siteEntry.href,
                                type: 'target'
                            }],
                            impact: []
                        };
                    }
                    memo[domain].impact.push(_.pick(siteEntry, ['country', 'countryImpact', 'reach', 'ppl']));
                });
                return memo;
            }, {});
        })
        .tap(function() {
            retD.source = retD.source.values();
        })
        .return(retD);
};

/* maybe other function to operate over the files will be implemented:
 write, update, delete, I don't know */
module.exports = {
    confsource: confsource
};

/*
debug("%s is IGNORED at the moment ☞ only the 「 world 」 section is considered",
    sourceName); */
