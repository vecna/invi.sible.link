var _ = require('lodash'),
    Promise = require('bluebird'),
    jsonReader = require('./jsonfiles').jsonReader;
    debug = require('debug')('lib.confinput'),
    path = require('path'),
    fs = require('fs');

Promise.promisifyAll(fs);

/* load all the URL source files defined in the config. read a country
   JSON file and many URLs file */

var readCountriesURLs = function(configContent) {

    console.log(JSON.stringify(configContent, undefined, 2));
    return Promise.map(configContent.world.filePrefix, function(tlc) {

        return jsonReader(path.join(configContent.world.locationDir, tlc + '.json'))
            .then(function(countryURLsContent) {
                return _.map(countryURLsContent, function(siteEntry) {
                    /* this is partially bad, I've splitted the parsing between ATS and here, but
                       is because I'm not very sure of the Amazon format */
                    if (!(( _.size(siteEntry.nationalReach) && siteEntry.nationalReach[0] === undefined)
                            && ( _.size(siteEntry.nationalPV) && siteEntry.nationalPV[0] === undefined))) {
                        debugger;
                    }
                    return {
                        country: tlc,
                        href: siteEntry.href,
                        nationalRank: siteEntry.nationalRank,
                        globalRank: siteEntry.globalRank,
                        nationalReach: _.parseInt(siteEntry.nationalReach[0]["aws:PerMillion"]),
                        nationalPageV: _.parseInt(siteEntry.nationalPV[0]["aws:PerMillion"]),
                        nationalPageC: _.parseInt(siteEntry.nationalPV[0]["aws:PerUser"]),
                    }
                });
            })
            .tap(function(sth) {
                console.log(JSON.stringify(sth, undefined, 2));
            })
            ;
    })
    .tap(function(siteMatrix) {
        debug("siteMatrix is composed by %d URLs from %d sources",
            _.size(siteMatrix), _.size(configContent.world.filePrefix));
    })
    /* 80 URLs x #Countries, with many duplication */
    .then(function(siteMatrix) {
        debugger;
        return siteMatrix;
    });
}

var confsource = function(configFile, sourceName) {

    var retD = { config: null, source: null, companies: null };

    debug("%s is IGNORED at the moment ☞ only the 「 world 」 section is considered",
        sourceName);

    return new Promise(function(__r, __w) {
        jsonReader(configFile)
        .then(function(configContent) {
            retD.config = configContent;
            retD.source = readCountriesURLs(configContent);
            retD.companies = jsonReader(configContent.companies);
            return retD;
        });
    })
};

/* maybe other function to operate over the files will be implemented:
 write, update, delete, I don't know */
module.exports = {
    confsource: confsource
};

