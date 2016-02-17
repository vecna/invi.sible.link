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

var alexasFountain = function(countryDict) {
 /* please, feel free to drink a bit from alexa's fountain */
    var command = "php -f bin/alexaformatGET.php " +
        process.env.ALEXA_ACCESSKEY + " " +
        process.env.ALEXA_SECRET + " " +
        countryDict.code;

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
}

var weListenAlexa = function(preciousContent) {
    /* Yes, it is precious, I lost ~ 30$ for the wrong development test */

    var fname = "config/world/" + preciousContent['aws:TopSitesResponse']['aws:Response'][0]
                            ['aws:TopSitesResult'][0]['aws:Alexa'][0]
                            ['aws:TopSites'][0]['aws:Country'][0]['aws:CountryCode'][0],
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
        .writeFileAsync(fname, fcontent)
        .tap(function(__ignore) {
            debug("Written file %s", fname);
            console.log(JSON.stringify(fcontent, undefined, 2))
        })
        .then(function(__ignore) {
            fcontent.savedFile = fname;
            return fcontent;
        });
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
                    'receivedContent': 'config/world/.notprocessed/' + country.country,
                    'country': country.country,
                    'ppl': _.parseInt(country.ppl),
                    'code': country.codes.substr(0, 2)
                }
            })
            .reduce
            .map(alexasFountain)
            .then(function(bah) {
                bah.alexaURL = "http://localhost:8000/XML_official";
            })
            .map(function(alexaURL) {
                return request
                    .getAsync(alexaURL)
                    .then(function(preciousContent) {
                        return weListenAlexa(JSON.parse(preciousContent.body));
                    })
                    /*
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
                    */
            })
            .then(function(dumpInfo) {
                debug("Dump done properly in %j", dumpInfo);
            })
            .return(datainput);
};
