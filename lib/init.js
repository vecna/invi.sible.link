var _ = require('lodash'),
    Promise = require('bluebird'),
    jsonReader = require('./jsonfiles').jsonReader;
    debug = require('debug')('lib.initialize'),
    moment = require('moment'),
    analytics = require('../lib/analytics'),
    path = require('path'),
    baseHasher = require('../lib/transformer').baseHasher,
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

var initialize = function(configFile, randSubsect) {

    var retD = { config: null, source: null, companies: null },
        randomSample = _.isNaN(_.parseInt(randSubsect)) ? 100 : _.parseInt(randSubsect);

    debug("Start creating base data envelope, using the %d%% of sites", randomSample);
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
                .tap(function(cInfo) {
                    retD.companies = _.reduce(cInfo, function(memo, cdomains, cname) {
                        _.each(cdomains, function(domain) {
                            memo[domain] = cname;
                        });
                        return memo;
                    }, {});
                    debug("From %d companies in %s, mapped in %d domains",
                        _.size(cInfo), retD.config.companies, _.size(retD.companies));
                });
        })
        .tap(function() {
            retD.source = _.reduce(retD.source, function(memo, countryList) {
                _.each(countryList, function(siteEntry) {
                    var key = baseHasher(siteEntry.href);
                    if (_.isUndefined(memo[key])) {
                        memo[key] = {
                            when: moment().format('YYMMDD'),
                            globalRank: siteEntry.globalRank,
                            _ls_links: [{
                                href: 'http://' + siteEntry.href,
                                type: 'target'
                            }],
                            impact: []
                        };
                    }
                    memo[key].impact.push(
                        _.pick(siteEntry, ['country', 'countryImpact', 'reach', 'ppl'])
                    );
                });
                return memo;
            }, {});
        })
        .tap(function() {
            retD.source = _.values(retD.source);

            if (randomSample !== 100) {
                var kept = _.round((_.size(retD.source) * randomSample) / 100);
                kept = (kept === 0) ? 2 : kept;
                debug("Filtering out %d sites from %d (picking only %d%% = %d)",
                    _.size(retD.source) - kept, _.size(retD.source), randomSample, kept);
                retD.source = _.sample(retD.source, kept);
            }
            debug("initialization complete!");
        })
        .return(retD);
};

/* maybe other function to operate over the files will be implemented:
 write, update, delete, I don't know */
module.exports = {
    initialize: initialize 
};

/*
debug("%s is IGNORED at the moment ☞ only the 「 world 」 section is considered",
    sourceName); */
