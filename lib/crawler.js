var _ = require('lodash'),
    Promise = require('bluebird'),
    debug = require('debug')('lib.harvest'),
    moment = require('moment'),
    cheerio = require('cheerio'),
    slotCutter = require('./slots').slotCutter,
    linkIdHash = require('../lib/transformer').linkIdHash,
    request = Promise.promisifyAll(require('request'));

/* interesting: http://stackoverflow.com/questions/9535521/elegant-multiple-char-replace-in-javascript-jquery */
var lineCleaned = function(line) {
    return line.replace(/\n/g, '').replace(/…More/, '').replace(/\\/g, '').replace(/\"/g, '\'');
}

var crawlSomeImpreciseData = function(urlObj) {
    debug("Operating over %s", urlObj.url);
    return request
        .getAsync(urlObj.url)
        .tap(function() {
          debug("Timing out 1300 ms");
        })
        .delay(1300)
        .then( function(response) {
            debug("HTTP status code from %s: %d", urlObj.url, response.statusCode);
            if (response.statusCode !== 200) {
              throw new Error("Harvest error: " + response.statusCode);
            }
            var resultsEntries = cheerio.load(response.body)('.site-listing');
            _.each(resultsEntries, function(li) {
                var siteName = (cheerio
                                    .load(li)('.desc-paragraph')
                                    .text())
                                    .toLowerCase();
                urlObj.retrieved.push({
                    ranked: _.parseInt(cheerio.load(li)('.count').text()),
                    href: lineCleaned("/siteinfo/" + siteName),
                    name: lineCleaned(siteName),
                    description: lineCleaned(cheerio.load(li)('.description').text())
                });
            });
            return urlObj;
        });
};

// http://www.alexa.com/topsites/category/Top/Arts
// http://www.alexa.com/topsites/category;2/Top/Business
// http://www.alexa.com/topsites/countries/GE
// http://www.alexa.com/topsites/countries;2/GE

var urlGeneration = function(prefix, suffixes, fnS, fnN)
{
    return _.reduce(suffixes, function(memo, suffix) {
        var i, pagedUrl,
            desc = suffix[fnN],
            field = suffix[fnS],
            referrer = process.env.COREURL + prefix;

        for(i = 0; i < 20; i++) {
            if(i === 0) {
                pagedUrl = process.env.COREURL + prefix + "/" + field;
            } else {
                pagedUrl = process.env.COREURL + prefix + ";" + i + "/" + field;
            }
            memo.push({
                when: moment().format('YYMMDD'),
                page: i,
                url: pagedUrl,
                referrer: referrer,
                kind: desc,
                retrieved: []
            });
            referrer = pagedUrl;
        }
        return memo;
    }, []);
};

var urlGeneratorSelector = function(kind, categories) {
    if (kind === 'CA') {
        return urlGeneration('category', categories, 'urlsection', 'name');
    } else if (kind === 'CO') {
        throw new Error("Not implemented!!");
        var countryMap = {};
        return urlGeneration('countries', countryMap, 'twolc', 'name');
    } else {
        throw new Error("Expected 'CA' or 'CO' as -k (kind = Countries or Categories).");
    }
};

var harvest = function(kind, slots, categories)
{
    var urls = urlGeneratorSelector(kind, categories),
        short = slotCutter(urls, slots);

    return Promise
        .each(short, crawlSomeImpreciseData)
        .tap(function(stica) {
            debug("crawlSomeImpreciseData done %d entries", _.size(stica));
            // console.log(JSON.stringify(stica, undefined, 2));
        });
};

module.exports = {
    harvest: harvest
}
