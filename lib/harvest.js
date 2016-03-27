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
    debug("Operating over %s (delay %d)", urlObj.url, urlObj.delay);
    return request
        .getAsync(urlObj.url)
        .delay(urlObj.delay)
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

var urlGeneration = function(prefix, maps, pages, toBeUsedK, toBePrintK)
{
    return _.reduce(maps, function(memo, suffix) {
        var i, pagedUrl,
            toBePrint = suffix[toBePrintK],
            toBeUsed = suffix[toBeUsedK],
            referrer = process.env.COREURL + prefix;

        if (_.isUndefined(toBePrint) || _.isUndefined(toBeUsed)) {
            throw new Error("Implementation Error!");
        }

        for(i = pages.start; i < pages.end; i++) {
            if(i === 0) {
                pagedUrl = process.env.COREURL + prefix + "/" + toBeUsed;
            } else {
                pagedUrl = process.env.COREURL + prefix + ";" + i + "/" + toBeUsed;
            }
            memo.push({
                when: _.parseInt(moment().format('YYMMDD')),
                page: i,
                url: pagedUrl,
                referrer: referrer,
                kind: prefix,
                belong: toBePrint,
                delay: 1000,
                retrieved: []
            });
            referrer = pagedUrl;
        }
        return memo;
    }, []);
};

var harvest = function(cStatus, kind, slots)
{
    /* cStatus KEYS: '.pStatus', '.countries' '.categories' '.pages' */
    debug("harvest with parameters: %s %s", kind, slots);
    var urls;
    if (kind === 'categories') {
        urls = urlGeneration('category', cStatus.categories, cStatus.pages, 'urlsection', 'name');
    } else if (kind === 'countries') {
        urls = urlGeneration('countries', cStatus.countries, cStatus.pages, 'twolc', 'twolc');
    } else {
        throw new Error("Implementation Error my friend!");
    }
    var short = slotCutter(urls, slots);
    return Promise
        .each(short, crawlSomeImpreciseData)
        .then(function(updatedResources) {
            if (_.isUndefined(cStatus.pStatus) || _.isNull(cStatus.pStatus)) {
              return updatedResources;
            } else {
              /* TODO be sure of no duplicates, put hash, check dates */
              return cStatus.pStatus.concat(updatedResources);
            }
        });
};

module.exports = {
    harvest: harvest
}
