var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('phantom');
var moment = require('moment');
var fs = Promise.promisifyAll(require('fs'));
var spawn = require('child_process').spawn;
var os = require('os');
var path = require('path');

var urlutils = require('../lib/urlutils');

var spawnCommand = function(command) {
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

  });
};

var setupDirectory = function(need) {
    need.disk = {
        directory: path.join(
            need.conf.root, 
            urlutils.urlToDirectory(need.href) )
    };
    need.disk.incompath = path.join(
        need.disk.directory,
        _.random(0, 0xffff) + "");

    debug("Disk would be used with these: %s",
        JSON.stringify(need.disk, undefined, 2));

    return spawnCommand({
                  binary: '/bin/mkdir', 
                  args: [ "-p", need.disk.directory ]
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
                need.conf.maxtime ]
    })
    .then(function() {
        need.phantom = {
            startTime: startTime.toISOString(),
            endTime: moment().toISOString(),
            startLoad: startLoad,
            endLoad: os.loadavg()[0],
            startMem: startMem,
            endMem: os.freemem()
        };
        debug("Fetch done ☞ 「%s」to 「%s」",
            moment.duration(moment().diff(startTime)).humanize(),
            need.href );
        return need;
    });
};


/* the need is only one, always, (but might contain many URL per need ?) */
module.exports = function(need, conf) {

  if(!conf || _.isUndefined(conf.maxtime)) {
      conf = {
          maxtime: 30,
          root: "./phantomtmp"
      };
      debug("Setting default config %j", conf);
  }

  return Promise
      .map([ _.extend(need, {
          conf: conf,
          'disk': null,
          'phantom': null
      }) ], setupDirectory)
      .then(_.first)
      .then(performPhantom);
};

