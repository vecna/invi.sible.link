var _ = require('lodash'),
    Promise = require('bluebird'),
    debug = require('debug')('plugin.fetcher'),
    moment = require('moment'),
    child_process = require('child_process'),
    fs = require('fs');

Promise.promisifyAll(fs);

var Ghostbuster = function (executable, command, MaxExecTime) {
    /* execute phantoms, lynx and curl */
    debug("\tExecuting %s", command);
    try {
        child_process
            .execSync(command, {timeout: MaxExecTime });
        debug("\tExecution of %s completed", executable);
    } catch(error) {
        if (error.code != 'ETIMEDOUT') {
            console.error(error);
            console.log(JSON.stringify(error, undefined, 2));
            debug("\tExecution of %s failed", executable);
        }
    }
};

var WebFetcher = function(inPlaceObj, URL, LSFiles, MaxExecTime) {

    var phantomjs_command = "phantomjs crawl/phjsrender.js "
        + "'" + URL + "'"
        + " "
        + LSFiles.savedir
        + " "
        + LSFiles.rootname
        + " "
        + MaxExecTime;
    var lynx_command = "lynx -dump "
        + "'" + URL + "'"
        + " > "
        + LSFiles.files.text;
    /* Important to take content-type and true location against redirect */
    var curl_command = "curl -N -L --head "
        + "'" + URL + "'"
        + " -o "
        + LSFiles.files.headers;

    var command_list = [
        Ghostbuster('phantom', phantomjs_command, MaxExecTime * 1000 + 5000),
        Ghostbuster('lynx', lynx_command, MaxExecTime * 1000),
        Ghostbuster('curl', curl_command, MaxExecTime * 1000)
    ];

    return Promise
        .all(command_list)
        .then(function() {
            return fs.writeFileSync(LSFiles.savedir + "/" + 'URLinfo.txt', URL, {flag: 'w+'});
        })
        /* this goes in _ls_fetch */
        .then(function() {
            inPlaceObj._ls_fetch = {
                status: 'done',
                host: LSFiles.host,
                savedir: LSFiles.savedir,
                when: LSFiles.rootname
            };
        });
};

var GetRelativePaths = function(TargetDir, shortHash, URL) {
    /* is important for a complex URL get the parameter and save it,
     * because maybe duckduckgo or twitter return a different URL with the same content ?
     * and because we can get multiple URL from the same domain */

    if (TargetDir.charAt(TargetDir.length -1) != '/') {
        TargetDir = TargetDir + "/";
    }

    var Host = URL.split('/')[2];

    /* so, is created BOHdir/www.ilpost.it/331231/www.ilpost.it_331231_1512041131.*
     at the 11:31 of 04 December 2015, so when the time increment is possible use ">"
     comparison to check for the last. the separation in subdir is to avoid that very
     well frequent domain can fillup the directory inodes
     */
    var SubDir = TargetDir + Host + "/" + shortHash + "/";
    var RootFname = moment().format('YYMMDDHHmm');

    return {
        host: Host,
        hash: shortHash,
        savedir: SubDir,
        rootname: RootFname,
        files : {
            dom: SubDir + RootFname + '.html',
            timeout: SubDir + RootFname + '.timeout',
            render: SubDir + RootFname + '.jpeg',
            io: SubDir + RootFname + '.details',
            text: SubDir + RootFname + '.text',
            headers: SubDir + RootFname + '.headers'
        }
    };
};

/* "ITA": [ { "url" ... }. {"url" ..} ], so if we split
    the dict, can be managed currency. every task here is not in parallel */
var retrievePages = function(urlList) {

    return Promise.each(urlList, function(siteEntry) {

        if (siteEntry._ls_links.length !== 1) {
            console.log(JSON.stringify(siteEntry, undefined, 2));
            throw new Error("a Link object in " + siteEntry.source +
                " has more than one _ls_links");
        }

        /* every time that chopsticks runs has to run in a dedicated directory,
           so different content x time */
        var linkObject = siteEntry._ls_links[0],
            href = linkObject.href,
            Paths = GetRelativePaths(
                process.env.FETCHER_TARGET,
                _.trunc(linkObject._ls_id_hash, { length: 6, omission: '' }),
                href);

        /* next improvement is extend the mongodb query
         and time comparison, to understand if the crawl is late than 1 day or not
         (or other indicator per page) */
        return fs
            .statAsync(Paths.savedir)
            .then(function(presence) {
                debug("Directory %s already present: skipping", Paths.files.render);
                linkObject._ls_fetch = {
                    status: 'skipped',
                    when: moment().format('YYMMDDHHmm'),
                    savedir: Paths.savedir
                }
            })
            .catch(function(failure) {
                return WebFetcher(
                    siteEntry,
                    href,
                    Paths,
                    process.env.FETCHER_MAXTIME );
            });
    });
};

module.exports = function(siteObject) {
    var fetchPromises = [];

    if (!_.has(siteObject, '1')) {
        throw new Error("Invalid dataformat, (urlops plugin has to be called before)")
    }
    debug("Sources %j ", siteObject);

    /* in theory, we have only "type": "target" kind of href */
    _.each(siteObject, function(siteList, order) {
        debug("Order %d sitelist %j", order, siteList);
        fetchPromises.push(retrievePages(siteList));
    });
    return Promise
        .all(fetchPromises) // , { concurrency: process.env.FETCHER_CONCURRENCY})
        .then(function(results) {
            console.log(JSON.stringify(results, undefined, 2));
            return results;
        });

    /* This is a side effect only plugin:
        creates file, but do not change the content */
};

module.exports.argv = {
    'fetcher.target': {
        nargs: 1,
        type: 'string',
        default: 'tempdump',
        desc: 'Save URL directories into this directory.'
    },
    'fetcher.maxtime': {
        nargs: 1,
        default: 10,
        desc: 'Max amount of seconds which a web fetcher can run'
    },
    'fetcher.concurrency': {
        nargs: 1,
        default: 3,
        desc: 'Concurrency in fetcher executions'
    }
};