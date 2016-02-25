var _ = require('lodash'),
    Promise = require('bluebird'),
    debug = require('debug')('plugin.fetcher'),
    moment = require('moment'),
    exec = require('child_process').exec;
    fs = Promise.promisifyAll(require('fs'));
    os = require('os');


/* at least 24 hours lost with child_process.spawn until I found this:
http://stackoverflow.com/questions/35062031/complexe-child-process-not-working-with-promise-bluebird
... enjoy! https://soundcloud.com/majorlazer/major-lazer-dj-snake-lean-on-feat-mo */
function promiseFromChildProcess(child) {
    return new Promise(function (resolve, reject) {
        child.addListener("error", reject);
        child.addListener("exit", resolve);
    });
}

var executer = function(command, milliSec, cmdID, siteEntry) {

    var child = exec(command),
        startTime = moment();

    promiseFromChildProcess(child)
        .delay(milliSec)
        .then(function (result) {

            var resultLogF = siteEntry._ls_dir.location + 'executions.log',
                content = JSON.stringify({
                    url: siteEntry._ls_links[0].href,
                    startTime: startTime,
                    endTime: moment().format('HH:mm:SS'),
                    hash: siteEntry._ls_links[0]._ls_id_hash
                }, undefined, 2);

            debug("Promise %s complete (%d ms) [diff: %s]",
                cmdID, milliSec, moment().diff(startTime));
            return fs
                .writeFileAsync(resultLogF, content, {flag: 'w+'})
                .then(function() {
                    debug("Written %s from %s", resultLogF, cmdID );
                    siteEntry.is_present = true;
                    siteEntry.savedLog = resultLogF;
                    return siteEntry;
                })

        }, function (err) {
            debug("Promise %s rejected (%d ms) with error: %s [diff: %s]",
                cmdID, milliSec, err, moment().diff(startTime));
            siteEntry.savedLog = null;
            return siteEntry;
        })
        .tap(function(updatedSource) {
            console.log(JSON.stringify(updatedSource, undefined, 2));
        })
        .delay(1000);


    child.stdout.on('data', function (data) {
        // console.log('stdout: ' + data);
    });
    child.stderr.on('data', function (data) {
        // console.log('stderr: ' + data);
    });
    child.on('close', function (code) {
        debug("Closing %s (%d) with code: %s [diff: %s]",
            cmdID, milliSec, code, moment().diff(startTime));
    });
}

var pageFetch = function(siteEntry, cnt) {

    var milliSec = (process.env.FETCHER_MAXTIME * 1000) + 5000,
        mkdirc = "/bin/mkdir " + [ "-p", siteEntry._ls_dir.location ].join(" "),
        phantc = [ "node_modules/.bin/phantomjs",
                    "--config=crawl/phantomcfg.json",
                    "crawl/phjsrender.js",
                    "'" + siteEntry._ls_links[0].href + "'",
                    siteEntry._ls_dir.location,
                    siteEntry._ls_dir.timeString,
                    process.env.FETCHER_MAXTIME
                 ].join(" "),
        currentLoad = os.loadavg()[0];

    currentLoad = (currentLoad < 1) ? 1 : currentLoad;
    debug("Site %s, Load %d %s", siteEntry._ls_links[0].href, currentLoad, cnt);
    executer(mkdirc + " ; " + phantc, milliSec, "K" + cnt) // _.round(currentLoad * maxExecTime),
    debug("Returning now!");
    return siteEntry;
};



module.exports = function(val) {

    debug("Chain of fetch ready: %d fetches, concurrency %d",
        val.source.length, process.env.FETCHER_CONCURRENCY );

    return Promise
        .map(val.source, pageFetch, { concurrency : process.env.FETCHER_CONCURRENCY })
        .delay(20000)
        .then(function(updatedSource) {
            debug("Yes!");
        //    console.log(JSON.stringify(filesGenerated, undefined, 3));
        })
        .delay(3000)
        .then()
        .return(val);

};

module.exports.argv = {
    'fetcher.maxtime': {
        nargs: 1,
        default: 30,
        desc: 'Max amount of seconds which a web fetcher can run'
    },
    'fetcher.concurrency': {
        nargs: 1,
        default: 3,
        desc: 'Concurrency in fetcher executions'
    }
};
