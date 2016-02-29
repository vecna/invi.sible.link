var _ = require('lodash'),
    Promise = require('bluebird'),
    debug = require('debug')('plugin.fetcher'),
    moment = require('moment'),
    fs = Promise.promisifyAll(require('fs'));
    os = require('os'),
    execChainable  = require('exec-chainable');


var pageFetch = function(siteEntry, cnt, totalCount) {

    var milliSec = (process.env.FETCHER_MAXTIME * 1000) + 5000,
        mkdirc = "/bin/mkdir " + [ "-p", siteEntry._ls_dir.location ].join(" "),
        hackishDelay =  (process.env.FETCHER_DELAY * cnt),
        phantc = [ "node_modules/.bin/phantomjs",
                    "--config=crawl/phantomcfg.json",
                    "crawl/phjsrender.js",
                    "'" + siteEntry._ls_links[0].href + "'",
                    siteEntry._ls_dir.location,
                    siteEntry._ls_dir.timeString,
                    process.env.FETCHER_MAXTIME
                 ].join(" "),
        launchTime = moment();

    return execChainable(mkdirc).delay(hackishDelay * 1000).then(function () {
        var startLoad = os.loadavg()[0],
            startMem = os.freemem(),
            startTime = moment();
        return execChainable(phantc)
            .then(function(stdout) {
                var resultLogF = siteEntry._ls_dir.location + 'executions.log',
                    content = {
                        fetch_id: cnt,
                        href: siteEntry._ls_links[0].href,
                        href_hash: siteEntry._ls_links[0]._ls_id_hash,
                        startTime: startTime.format('HH:mm:SS'),
                        endTime: moment().format('HH:mm:SS'),
                        startLoad: startLoad,
                        endLoad: os.loadavg()[0],
                        startMem: startMem,
                        endMem: os.freemem(),
                        completed: moment().toISOString(),
                    };
                debug("Fetch #%d of %d done ☞ active 「%s」 end estimated in「%s」",
                        cnt,
                        totalCount,
                        moment.duration(moment().diff(launchTime)).humanize(),
                        moment.duration(
                            process.env.FETCHER_DELAY * (totalCount - cnt),
                            'seconds').humanize() );
                return fs
                    .writeFileAsync(resultLogF, JSON.stringify(content), {flag: 'w+'})
                    .then(function() {
                        if(siteEntry.is_present === true) {
                            debug("Multiple fetch of %s has been done",
                                siteEntry._ls_links[0]._ls_id_hash);
                        }
                        siteEntry.is_present = true;
                        return siteEntry;
                    });
            })
            .catch(function(error) {
                debug("Error %s", error);
                debug("Error with %s", phantc);
                return siteEntry;
            })
        });
};



module.exports = function(val) {
    /* This module, OR fromDisk, has to be used. they provide:
        which is: val.source.[siteEntry].savedLog = {} */

    debug("Chain of fetch: %d fetches, delay %d, concurrency %d, estimated: %s",
            val.source.length,
            process.env.FETCHER_DELAY,
            process.env.FETCHER_CONCURRENCY,
            moment.duration(process.env.FETCHER_DELAY * val.source.length, 'seconds').humanize()
    );

    return Promise
        .map(val.source, pageFetch, { concurrency : process.env.FETCHER_CONCURRENCY })
        .then(function(updatedSource) {
            debug("all the fetch are done!");
            val.source = updatedSource;
            return val;
        });
};

module.exports.argv = {
    'fetcher.maxtime': {
        nargs: 1,
        default: 30,
        desc: 'Max amount of seconds which a web fetcher can run'
    },
    'fetcher.concurrency': {
        nargs: 1,
        default: 10,
        desc: 'Concurrency in fetcher executions'
    },
    'fetcher.delay': {
        nargs: 1,
        default: 4.2,
        desc: 'Amount of seconds between one phantom dispatch and the next'
    }
};
