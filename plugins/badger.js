var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('plugin:badger');
var moment = require('moment');
var fs = Promise.promisifyAll(require('fs'));
var spawn = require('child_process').spawn;
var os = require('os');
var path = require('path');

var urlutils = require('../lib/urlutils');
var spawnCommand = require('../lib/cmdspawn');

var setupDirectory = function(need) {
    /* in badger are not used the unicode strange things, but the 'id' */
    need.disk = {
        directory: path.join( need.conf.root, need.id)
    };
    need.disk.incompath = path.join(
        need.disk.directory,
        moment().format("YYYY-MM-DD")
    );
    debug("setupDirectory %s", need.disk.incompath);

    return spawnCommand({
                  binary: '/bin/mkdir',
                  args: [ "-p", need.disk.incompath ]
    })
    .catch(function(error) {
        debug("mkdir Error %s (tolerated)", JSON.stringify(error, undefined, 2));
    })
    .return(need);
};

var performBadger = function(need) {

    var startLoad = os.loadavg()[0];
    var startMem = os.freemem();
    var startTime = moment();
    var outfile = path.join(need.disk.incompath, 'badger-output.json');

    debug("performBadger to %s in %s", need.href, need.id);
    return spawnCommand({
        binary: '/usr/bin/python2.7',
        args: [ 'badger-claw/crawler.py', need.href ],
        environment: {
            OUT_FILE: outfile,
            TIMEOUT: need.conf.maxSeconds,
            PATH: process.env.PATH,
            EXTENSION_PATH: 'badger-claw/privacy-badger-symlink.crx'
        }
    }, 0)
    .then(function() {
        need.badger = {
            startTime: startTime.toISOString(),
            endTime: moment().toISOString(),
            startLoad: startLoad,
            endLoad: os.loadavg()[0],
            startMem: startMem,
            endMem: os.freemem(),
            closed: true
        };
        debug("Clean close of Selenium: ☞ 「%s」to 「%s」",
            moment.duration(moment().diff(startTime)).humanize(),
            need.href );
        return need;
    })
    .catch(function(error) {
        if(error.name === "TimeoutError") {
            need.badger = {
                startTime: startTime.toISOString(),
                endTime: moment().toISOString(),
                startLoad: startLoad,
                endLoad: os.loadavg()[0],
                startMem: startMem,
                endMem: os.freemem(),
                completed: false
            };
            debug("Timeout reached ☞ 「%s」to 「%s」",
                moment.duration(moment().diff(startTime)).asSeconds(),
                need.href );
            return need;
        }
        debug("Unexpected error %j", JSON.stringify(error, undefined, 2));
        throw new Error(error);
    });
};

/* the need is only one, always, and contains one URL per need */
module.exports = function(need, conf) {

    if(!_.startsWith(need.href, 'http')) {
        debug("The URL has to begin with http!");
        process.exit();
    }

    return setupDirectory(_.extend(need, {
        conf: conf,
            'disk': null,
            'badger': null
    }))
    .then(performBadger);
};
