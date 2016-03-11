var _ = require('lodash'),
    Promise = require('bluebird'),
    jsonReader = require('./jsonfiles').jsonReader;
    debug = require('debug')('lib.init'),
    moment = require('moment'),
    analytics = require('../lib/analytics'),
    path = require('path'),
    baseHasher = require('../lib/transformer').baseHasher,
    fs = require('fs');

Promise.promisifyAll(fs);


var takeCategory = function(line) {
    return line.substr(1, (_.size(line)-2) );
};

var readIniFile = function(configContent, countriesInfo) {

    debug("Importing URL files for: %s", configContent.world.description);

    return Promise.map(configContent.world.filePrefix, function(two_lc) {

        var fname = path.join(configContent.world.locationDir, two_lc + '.' + configContent.world.type);
        debug("Accessing to .ini-style file %s", fname);

        return fs
            .readFileAsync(fname)
            .then(function(iniContent) {
                return _.reduce(iniContent.toString().split('\n'), function(memo, line) {
                    if (_.startsWith(line, "[")) {
                        memo.last_category = takeCategory(line);
                        return memo;
                    }
                    if (_.startsWith(line, "#") || (!_.startsWith(line, 'http'))) {
                        return memo;
                    }
                    memo.content.push({
                        href: line,
                        category: memo.last_category,
                        country: two_lc,
                    });
                    return memo;
                }, { content: [], last_category: "missing?"}).content;
            })
            .tap(function(content) {
                debug("From file %s took %d sources", fname, _.size(content));
            })
            .catch(function(e) {
                debug("Error with %s", fname);
                console.error(e.stack);
            });
    });
};

/*

THIS HAS BEEN AN EXPERIMENTAL FORMAT WITH SOME ALEXA INFO PUT INSIDE THE JSON: BAD IDEA,
ALSO BECAUSE ALEXA PROVED TO BE A SUBOPTIMAL RESOURCE

var readCountriesURLs = function(configContent, countriesInfo) {

    return Promise.map(configContent.world.filePrefix, function(tlc) {

        return jsonReader(path.join(configContent.world.locationDir, tlc + '.json'))
            .then(function(countryURLsContent) {
                return _.map(countryURLsContent, function(siteEntry) {

                    if ( _.parseInt(siteEntry.nationalReach[0]["aws:PerMillion"])  > (1000 * 1000) ) {
                        debug("Wtf in %s for %s", tlc, siteEntry.href);
                    }
                    // https://forums.aws.amazon.com/message.jspa?messageID=265890
                    var reachPM = _.parseInt(siteEntry.nationalReach[0]["aws:PerMillion"]),
                        pvPU = _.parseInt(siteEntry.nationalPV[0]["aws:PerUser"]),
                        pvPM = _.parseInt(siteEntry.nationalPV[0]["aws:PerMillion"]);

                    return {
                        country: tlc,
                        href: siteEntry.href,
                        nationalRank: siteEntry.nationalRank,
                        globalRank: siteEntry.globalRank,
                        reachPM: reachPM,
                        nationalPrcnt: _.round( (reachPM * 100) / (1000 * 1000) ),
                        ppl: _.parseInt(countriesInfo[tlc].ppl),
                        pvPU: pvPU,
                        pvPM: pvPM,
                    }
                });
            })
    });
};
*/

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
                    // return readCountriesURLs(retD.config, worldCountries);
                    return readIniFile(retD.config, worldCountries);
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
                            // when: moment().format('YYMMDD'),
                            category: siteEntry.category,
                            globalRank: siteEntry.globalRank,
                            _ls_links: [{
                                // href: 'http://' + siteEntry.href,
                                href: siteEntry.href,
                                type: 'target'
                            }],
                            visibility: []
                        };
                    }
                    memo[key].visibility.push(
                        _.pick(siteEntry, [ 'country', 'reachPM', 'nationalPrcnt',
                                            'ppl', 'pvPU', 'pvPM', 'nationalRank' ])
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
            debug("Initialization complete using %s", process.env.WORLD_DESCRIPTION);
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
