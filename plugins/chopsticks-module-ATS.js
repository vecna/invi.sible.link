var _ = require('lodash'),
    Promise = require('bluebird'),
    debug = require('debug')('plugin.ATS'),
    jsonReader = require('../lib/jsonfiles').jsonReader,
    moment = require('moment'),
    exec = require('child_process').exec,
    xml2js = Promise.promisifyAll(require('xml2js')),
    request = Promise.promisifyAll(require('request')),
    fs = Promise.promisifyAll(require('fs'));

/*
 * This is a plugin that download from Amazon AWS service some
 * Alexa top websites per country. This is essential to maintain
 * the proper configuration settings
 */

var alexasFountain = function(countryDict) {
 /* please, feel free to drink a bit from alexa's fountain */
    var command = "php -f bin/alexaformatGET.php " +
        process.env.ALEXA_ACCESSKEY + " " +
        process.env.ALEXA_SECRET + " " +
        countryDict.code + " " +
        process.env.ATS_START + " " +
        process.env.ATS_NUMBER;

    debug("Generating for %s, %d ppl", countryDict.country, countryDict.ppl);
    return new Promise(function(resolve, reject) {
        exec(command, function(err, stdout) {
            if(err) {
                reject(err);
            } else {
                resolve(stdout);
            }
        });
    })
    .then(function(amazonURL) {
        countryDict.alexaURL = amazonURL;
    })
    .return(countryDict);
};

var weListenAlexa = function(preciousContent) {
    /* Yes, it is precious, I lost ~ 30$ for the wrong development test */

    var fname = "config/world/" + preciousContent['aws:TopSitesResponse']['aws:Response'][0]
                            ['aws:TopSitesResult'][0]['aws:Alexa'][0]
                            ['aws:TopSites'][0]['aws:Country'][0]['aws:CountryCode'][0] + '.json',
        dirtyC = preciousContent['aws:TopSitesResponse']['aws:Response'][0]['aws:TopSitesResult']
                    [0]['aws:Alexa'][0]['aws:TopSites'][0]['aws:Country'][0]['aws:Sites'][0],
        fcontent = _.map(dirtyC['aws:Site'], function(ds) {
            return {
                href: ds['aws:DataUrl'][0],
                nationalRank: _.parseInt(ds['aws:Country'][0]['aws:Rank'][0]),
                nationalReach: ds['aws:Country'][0]['aws:Reach'],
                nationalPV: ds['aws:Country'][0]['aws:PageViews'],
                globalRank: _.parseInt(ds['aws:Global'][0]['aws:Rank'][0])
            }
        });

    return fs
        .writeFileAsync(fname, JSON.stringify(fcontent, undefined, 2))
        .tap(function(__ignore) {
            debug("Written file %s", fname);
        })
        .return(fname);
};

var argumentFiltering = function(newList, formattedCountry, index, size) {

    var acceptableCountries;

    if (process.env.ATS_CC === "") {
        console.error("You can't use plugin ATS without explicitly put a country codes or 'ALL' ");
        throw new Error("lacking of magic words before spend money!");
    }

    if (process.env.ATS_CC.indexOf(',') !== -1) {
        acceptableCountries = process.env.ATS_CC.split(',');
    } else if(process.env.ATS_CC === 'ALL') {
        acceptableCountries = true;
    } else if(process.env.ATS_CC.length === 2) {
        acceptableCountries = [ process.env.ATS_CC ];
    } else {
        throw new Error("Invalid code? not two letter, not 'ALL', not a list...");
    }

    if (acceptableCountries === true || acceptableCountries.indexOf(formattedCountry.code) !== -1) {
        debug("Accepted %s (%s) as country to be fetched", formattedCountry.code, formattedCountry.country);
        newList.push(formattedCountry);
    }
    return newList;
};

module.exports = function(datainput) {

    /* idempotent function, generate a file called ATS.json and contain the website formatted,
       ignore the current input and return the same. also if technically speaking this plugin
       can change datainput.source */
    return jsonReader('config/world/countriesInfos.json')
            .then(function(countryContent) {
                /* pick only countries with more than N-Million of citizen */
                return _.pick(countryContent, function(e) {
                    return e.ppl > 1 * 1000 * 1000;
                });
            })
            .then(function(countryObj) {
                return _.values(countryObj);
            })
            .map(function(country) {
                /* The codes are "codes": "CN / CHN" I need just two letter code here */
                return {
                    'when': moment().format('YYMMDD'),
                    'receivedContent': 'config/world/.notprocessed/' + country.country,
                    'country': country.country,
                    'ppl': _.parseInt(country.ppl),
                    'code': country.codes.substr(0, 2)
                }
            })
            .reduce(argumentFiltering, [])
            .map(alexasFountain)
            /*
            .map(function(countryObj) {
                debug("%s", countryObj.alexaURL);
                countryObj.alexaURL = "http://localhost:8000/" + country.;
                return countryObj;
            })
            */
            .map(function(countryObj) {
                return request
                    .getAsync(countryObj.alexaURL)
                    .then(function (response) {
                        var parser = new xml2js.Parser();
                        return parser.parseStringAsync(response.body);
                    })
                    .tap(function(preciousContent) {
                        return fs
                            .writeFileAsync( countryObj.receivedContent,
                                JSON.stringify(preciousContent, undefined, 2))
                            .then(function(__ignore) {
                                debug("Written temporary file %s",
                                    countryObj.receivedContent);
                            })
                    })
                    .then(function(preciousContent) {
                        return weListenAlexa(preciousContent);
                    })
            })
            .return(datainput);
};


module.exports.argv = {
    'ATS.CC': {
        nargs: 1,
        type: 'string',
        default: "",
        desc: 'two letter country code to import: IT,CN,US,...'
    },
    'ATS.start': {
        nargs: 1,
        default: 1,
        desc: 'In the Alexa top sites per Country, start from'
    },
    'ATS.number': {
        nargs: 1,
        default: 80,
        desc: 'The number of sites to retrieve'
    },
    'ATS.redo' : {
        nargs: 1,
        default: 0,
        desc: 'Repeat the request independently from the presence of the answers (maybe to be done when is old)'
    }
}
