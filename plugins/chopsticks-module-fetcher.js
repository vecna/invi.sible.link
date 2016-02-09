var _ = require('lodash'),
    Promise = require('bluebird'),
    debug = require('debug')('plugin.fetcher'),
    moment = require('moment'),
    child_process = require('child_process'),
    fs = require('fs'),
    fileStruct = require('../lib/jsonfiles').fileStruct;

Promise.promisifyAll(fs);

var Ghostbuster = function (executable, command, maxExecTime) {
    /* execute phantoms, lynx and curl */
    debug(" Executing %s", command);
    try {
        child_process
            .execSync(command, {timeout: maxExecTime });
        debug(" … %s completed", executable);
    } catch(error) {
        if (error.code != 'ETIMEDOUT') {
            console.error(error);
            console.log(JSON.stringify(error, undefined, 2));
            debug(" … %s failed %s", executable, command);
        } else {
            debug(" … %s interrupted by timeout", executable);
        }
    }
};

var WebFetcher = function(siteEntry, maxExecTime) {

    var fN = fileStruct(siteEntry._ls_dir.location, siteEntry._ls_dir.timeString),
        mkdirp_command = "mkdir -p " + siteEntry._ls_dir.location,
        phantomjs_command = "node_modules/.bin/phantomjs crawl/phjsrender.js "
            + "'" + siteEntry._ls_links[0].href + "'"
            + " "
            + siteEntry._ls_dir.location
            + " "
            + siteEntry._ls_dir.timeString
            + " "
            + maxExecTime,
        lynx_command = "lynx -dump "
            + "'" + siteEntry._ls_links[0].href + "'"
            + " > "
            + fN.text,
        curl_command = "curl -N -L --head "
            + "'" + siteEntry._ls_links[0].href + "'"
            + " -o "
            + fN.headers,
        command_list = [
            Ghostbuster('mkdir', mkdirp_command, maxExecTime * 1000),
            Ghostbuster('phantom', phantomjs_command, maxExecTime * 1000 + 5000),
            Ghostbuster('lynx', lynx_command, maxExecTime * 1000),
            Ghostbuster('curl', curl_command, maxExecTime * 1000)
        ],
        startTime = (new Date()).getTime();

    return Promise
        .all(command_list)
        .then(function() {
            var resultLogF = siteEntry._ls_dir.location + 'executions.log';
            return fs
                .writeFileAsync(resultLogF, JSON.stringify({
                    url: siteEntry._ls_links[0].href,
                    startTime: startTime,
                    endTime: (new Date()).getTime(),
                    executions: (new Date()).getTime() - startTime
            }, undefined, 2), {flag: 'w+'})
                .tap(function(resultLogF) {
                    debug("Written %s", resultLogF);
                });
        });
};

module.exports = function(val) {
    /* this is an idempotent module, do not change val */

    debug("Chain of fetch ready: %d fetches, concurrency %d",
        val.source.length, process.env.FETCHER_CONCURRENCY );

    return Promise
        .map(val.source, function(siteEntry) {
            /* in theory, we have here only "type": "target" kind of href
             * in theory, we have _ls_dir present: these elements can be assert-ed */
            debug("\t%s", siteEntry._ls_links[0].href);
            WebFetcher( siteEntry, process.env.FETCHER_MAXTIME );
            return null;
        } , // { concurrency: process.env.FETCHER_CONCURRENCY}
            { concurrency: 5}
        )
        .return(val);
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
        default: 30,
        desc: 'Max amount of seconds which a web fetcher can run'
    },
    'fetcher.concurrency': {
        nargs: 1,
        default: 3,
        desc: 'Concurrency in fetcher executions'
    }
};
