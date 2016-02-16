var _ = require('lodash'),
    Promise = require('bluebird'),
    debug = require('debug')('plugin.ATS'),
    moment = require('moment'),
//  cheerio = require('cheerio'),
    linkIdHash = require('../lib/transformer').linkIdHash,
    baseHasher = require('../lib/transformer').baseHasher,
    defaultFields = require('../lib/transformer').defaultFields,
    jsonReader = require('../lib/jsonfiles').jsonReader,
    exec = require('child_process').exec,
    xml2js = Promise.promisifyAll(require('xml2js')),
    request = Promise.promisifyAll(require('request')),
    fs = Promise.promisifyAll(require('fs'));

/*
 * This is a plugin that download from Amazon AWS service some
 * Alexa top websites per country. This is essential to maintain
 * the proper configuration settings
 */

/*
var parser = new xml2js.Parser();
parser.addListener('end', function(result) {
    console.dir(result);
    console.log('Done.');
});
fs.readFile(__dirname + '/foo.xml', function(err, data) {
    parser.parseString(data);
});
*/

var alexasFountain = function(countryCode) {
 /* please, feel free to drink a bit from alexa's fountain */
    var command = "php -f bin/alexaformatGET.php " +
        process.env.ALEXA_ACCESSKEY + " " +
        process.env.ALEXA_SECRET + " " +
        countryCode.code;

    debug("Generating for %s, %d ppl", countryCode.country, countryCode.ppl);

    return new Promise(function(resolve, reject) {
        exec(command, function(err, stdout) {
            if(err) {
                reject(err);
            } else {
                resolve(stdout);
            }
        });
    })
    .tap(function(amazonURL) {
        debug("%s", amazonURL);
    });
}

var weListenAlexa = function(preciousContent) {
    /* Yes, it is precious, I lost ~ 30$ for the wrong development test */

    var fname = "config/world/" + preciousContent['ns0:TopSitesResponse']['ns1:Response'][0]
                            ['ns1:TopSitesResult'][0]['ns1:Alexa'][0]
                            ['ns1:TopSites'][0]['ns1:Country'][0]['ns1:CountryCode'][0],
        dirtyC = preciousContent['ns0:TopSitesResponse']['ns1:Response'][0]['ns1:TopSitesResult']
                    [0]['ns1:Alexa'][0]['ns1:TopSites'][0]['ns1:Country'][0]['ns1:Sites'][0],
        fcontent = _.map(dirtyC['ns1:Site'], function(ds) {
            return {
                href: ds['ns1:DataUrl'][0],
                nationalRank: _.parseInt(ds['ns1:Country'][0]['ns1:Rank'][0]),
                nationalReach: ds['ns1:Country'][0]['ns1:Reach'],
                globalRank: _.parseInt(ds['ns1:Global'][0]['ns1:Rank'][0])
            }
        });

    return fs
        .writeFileAsync(fname, fcontent)
        .tap(function(preciousContent) {
            debug("Written file %s", fname);
            console.log(JSON.stringify(fcontent, undefined, 2))
        })
        .return({"savedFile": fname});
};

module.exports = function(datainput) {

    /* idempotent function, generate a file called ATS.json and contain the website formatted,
       ignore the current input and return the same. also if technically speaking this plugin
       can change datainput.source */
    return jsonReader('config/world/countriesInfos.json')
            .then(function(countryContent) {
                /* pick only countries with more than N-Million of citizen */
                return _.pick(countryContent, function(e) {
                    return e.ppl > 1200 * 1000 * 1000;
                });
            })
            .then(function(countryObj) {
                return _.values(countryObj);
            })
            .map(function(country) {
                /* The codes are "codes": "CN / CHN" I need just two letter code here */
                return {
                    'country': country.country,
                    'ppl': _.parseInt(country.ppl),
                    'code': country.codes.substr(0, 2)
                }
            })
            .map(alexasFountain)
            .then(function(bah) {
                return [ "http://localhost:8000/XML_offic" ];
            })
            .map(function(alexaURL) {
                return request
                    .getAsync(alexaURL)
                    .then(function (response) {
                        var parser = new xml2js.Parser();
                        return parser.parseStringAsync(response.body);
                    })
                    .tap(function(receivedContent) {
                        var rfname = "/tmp/" + _.parseInt(Math.random() * 0xffff);
                        return fs
                            .writeFileAsync( rfname,
                                JSON.stringify(receivedContent, undefined, 2))
                            .then(function(_spare) {
                                debug("Written temporary file %s", rfname);
                            })
                    })
                    .then(function(preciousContent) {
                        return weListenAlexa(preciousContent);
                    })
            })
            .then(function(dumpInfo) {
                debug("Dump done properly in %j", dumpInfo);
            })
            .return(datainput);
};
