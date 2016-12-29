var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('plugin:phantom');
var moment = require('moment');
var fs = Promise.promisifyAll(require('fs'));
var spawn = require('child_process').spawn;
var os = require('os');
var path = require('path');

var urlutils = require('../lib/urlutils');

var spawnCommand = function(command, msTimeout) {
    if(_.isUndefined(msTimeout))
        msTimeout = 1000;

    return new Promise(function(resolve, reject) {
        var M = spawn(command.binary, command.args);

        M.stdout.on('data', function(data) {
            /* this has to be just ignored or saved in TODO debug mode */
        });

        M.stderr.on('data', function(data) {
            debug("Error from %j", command.args);
            debug("Error? %s", data);
        });

        M.on('exit', function(code) {
            if (code && code.error) {
                debug("Exit with Error %j", code);
                return reject();
            } else {
                return resolve();
            }
        });
    })
    .timeout(msTimeout);
};

var setupDirectory = function(need) {
    need.disk = {
        directory: path.join(
            need.conf.root, 
            urlutils.urlToDirectory(need.href) )
    };
    need.disk.incompath = path.join(
        need.disk.directory,
        moment().format("YYYY-MM-DD")
    );

    debug("Using %s", need.disk.incompath);

    return spawnCommand({
                  binary: '/bin/mkdir',
                  args: [ "-p", need.disk.directory ]
    })
    .catch(function(error) {
        debug("mkdirError %j", JSON.stringify(error, undefined, 2));
        throw new Error("Impossible proceed after mkdir failure");
    })
    .return(need);
};

var performPhantom = function(need) {

    var startLoad = os.loadavg()[0];
    var startMem = os.freemem();
    var startTime = moment();

    return spawnCommand({
        binary: 'node_modules/.bin/phantomjs',
        args: [ "--config=fixtures/phantomcfg/phantomcfg.json",
                "fixtures/phantomcfg/phjsrender.js",
                need.href,
                need.disk.incompath,
                need.conf.maxSeconds ]
    }, (need.conf.maxSeconds + 5) * 1000)
    .then(function() {
        need.phantom = {
            startTime: startTime.toISOString(),
            endTime: moment().toISOString(),
            startLoad: startLoad,
            endLoad: os.loadavg()[0],
            startMem: startMem,
            endMem: os.freemem(),
            completed: true
        };
        debug("Fetch done ☞ 「%s」to 「%s」",
            moment.duration(moment().diff(startTime)).humanize(),
            need.href );
        return need;
    })
    .catch(function(error) {
        debug("phantomError %j", JSON.stringify(error, undefined, 2));
        if(error.name === "TimeoutError") {
            need.phantom = {
                startTime: startTime.toISOString(),
                endTime: moment().toISOString(),
                startLoad: startLoad,
                endLoad: os.loadavg()[0],
                startMem: startMem,
                endMem: os.freemem(),
                completed: false
            };
            debug("Timeout ☞ 「%s」to 「%s」",
                moment.duration(moment().diff(startTime)).humanize(),
                need.href );
            return need;
        }
        console.stack();
        debug("! %s", JSON.stringify(error, undefined, 2));
        throw new Error(error);
    });
};


/* the need is only one, always, (but might contain many URL per need ?) */
module.exports = function(need, conf) {

  return Promise
      .map([ _.extend(need, {
          conf: conf,
          'disk': null,
          'phantom': null
      }) ], setupDirectory)
      .then(_.first)
      .then(performPhantom);
};

