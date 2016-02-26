var _ = require('lodash'),
    Promise = require('bluebird'),
    debug = require('debug')('plugin.fetcher'),
    moment = require('moment'),
    exec = require('child_process').exec;
    fs = Promise.promisifyAll(require('fs'));
    os = require('os'),
    exec  = require('exec-chainable');


var pageFetch = function(siteEntry, cnt) {

    var milliSec = (process.env.FETCHER_MAXTIME * 1000) + 5000,
        mkdirc = "/bin/mkdir " + [ "-p", siteEntry._ls_dir.location ].join(" "),
        hackishDelay = _.round( (0.3 * (cnt % process.env.FETCHER_CONCURRENCY)) + 1),
        phantc = [ "node_modules/.bin/phantomjs",
                    "--config=crawl/phantomcfg.json",
                    "crawl/phjsrender.js",
                    "'" + siteEntry._ls_links[0].href + "'",
                    siteEntry._ls_dir.location,
                    siteEntry._ls_dir.timeString,
                    process.env.FETCHER_MAXTIME
                 ].join(" "),
        currentLoad = os.loadavg()[0],
        startTime = moment();

    return exec(mkdirc).delay(hackishDelay).then(function () {
    return exec(phantc)
        .then(function(stdout) {
            var resultLogF = siteEntry._ls_dir.location + 'executions.log',
                content = {
                    href: siteEntry._ls_links[0].href,
                    href_hash: siteEntry._ls_links[0]._ls_id_hash,
                    startTime: startTime,
                    endTime: moment().format('HH:mm:SS'),
                    completed: moment().toISOString(),
                };
            debug("Fetch #%d complete [elapsed: %s]", cnt, moment().diff(startTime));
            return fs
                .writeFileAsync(resultLogF, JSON.stringify(content), {flag: 'w+'})
                .then(function() {
                    siteEntry.is_present = true;
                    siteEntry.logFile = resultLogF;
                    return siteEntry;
                });
        })
        .catch(function(error) {
            throw new Error("Può succedere! gestiscimi ed usami!");
        })
    });
};



module.exports = function(val) {
    /* This module, OR fromDisk, has to be used. they provide:
        which is: val.source.[siteEntry].savedLog = {} */

    debug("Chain of fetch ready: %d fetches, concurrency %d",
        val.source.length, process.env.FETCHER_CONCURRENCY );

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
    }
};
