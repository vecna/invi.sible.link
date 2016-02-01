var _ = require('lodash'),
    Promise = require('bluebird'),
    debug = require('debug')('plugin.fetcher'),
    moment = require('moment'),
    child_process = require('child_process'),
    fs = require('fs'),
    fileStruct = require('../lib/fslogic').fileStruct;

Promise.promisifyAll(fs);

var Ghostbuster = function (executable, command, maxExecTime) {
    /* execute phantoms, lynx and curl */
    debug("\tExecuting %s", command);
    try {
        child_process
            .execSync(command, {timeout: maxExecTime });
        debug("\tExecution of %s completed", executable);
    } catch(error) {
        if (error.code != 'ETIMEDOUT') {
            console.error(error);
            console.log(JSON.stringify(error, undefined, 2));
            debug("\tExecution of %s failed", executable);
        }
    }
};

var WebFetcher = function(siteEntry, maxExecTime) {

    var fN = fileStruct(siteEntry._ls_dir.location, siteEntry._ls_dir.timeString),
        mkdirp_command = "mkdir -p " + siteEntry._ls_dir.location,
        phantomjs_command = "phantomjs crawl/phjsrender.js "
            + "'" + siteEntry._ls_links[0].href + "'"
            + " "
            + siteEntry._ls_dir.location
            + " "
            + siteEntry._ls_dir.timeString
            + " "
            + maxExecTime
            + " 2>&1 "
            + siteEntry._ls_dir.location + "phantom.stderr",
        lynx_command = "lynx -dump "
            + "'" + siteEntry._ls_links[0].href + "'"
            + " > "
            + fN.text,
        curl_command = "curl -N -L --head "
            + "'" + siteEntry._ls_links[0].href + "'"
            + " -o "
            + fN.headers
            + " 2>&1 "
            + siteEntry._ls_dir.location + "curl.stderr",
        command_list = [
            Ghostbuster('mkdir', mkdirp_command, maxExecTime * 1000),
            Ghostbuster('phantom', phantomjs_command, maxExecTime * 1000 + 5000),
            Ghostbuster('lynx', lynx_command, maxExecTime * 1000),
            Ghostbuster('curl', curl_command, maxExecTime * 1000)
        ],
        date = new Date(),
        startTime = date.getTime();

    return Promise
        .all(command_list)
        .then(function() {
            var endTime = date.getTime(),
                resultLogF = siteEntry._ls_dir.location + 'executions.json';
            fs.writeFileSync(resultLogF, JSON.stringify({
                    url: siteEntry._ls_links[0].href,
                    startTime: startTime,
                    endTime: endTime,
                    executions: endTime - startTime
            }, undefined, 2), {flag: 'w+'});
            return resultLogF;
        })
        /* this goes in _ls_fetch */
        .then(function(writtenLog) {
            siteEntry._ls_fetch = {
                status: 'done',
                where: writtenLog
            };
        });
};



module.exports = function(siteList) {

    debug("Chain of fetch ready: %d fetches, concurrency %d",
        siteList.length, process.env.FETCHER_CONCURRENCY );

    return Promise
        .map(siteList, function(siteEntry) {
            /* in theory, we have here only "type": "target" kind of href
             * in theory, we have _ls_dir present: these elements can be assert-ed */
            debug("\t%s", siteEntry._ls_links[0].href);
            WebFetcher( siteEntry, process.env.FETCHER_MAXTIME )
        } , { concurrency: process.env.FETCHER_CONCURRENCY})
        .then(function(results) {
            return results;
        });
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