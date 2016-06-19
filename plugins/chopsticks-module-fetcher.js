var _ = require('lodash'),
    Promise = require('bluebird'),
    debug = require('debug')('plugin.fetcher'),
    moment = require('moment'),
    fs = Promise.promisifyAll(require('fs')),
    spawn = require('child_process').spawn;
    os = require('os');


var setupDirectory = function(siteEntry) {
    return spawnCommand({
                  binary: '/bin/mkdir', 
                  args: [ "-p", siteEntry._ls_dir.location ]
    })
    .then(function() {
      return siteEntry;
    })
    .catch(function() {
      /* depends which reason mkdir can fail... */
      return null;
    });
};

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


var performPhantom = function(siteEntry) {

    var startLoad = os.loadavg()[0],
        startMem = os.freemem(),
        startTime = moment();

    return spawnCommand({
                  binary: 'node_modules/.bin/phantomjs',
                  args: [ "--config=crawl/phantomcfg.json",
                          "crawl/phjsrender.js",
                          siteEntry._ls_links[0].href,
                          siteEntry._ls_dir.location,
                          siteEntry._ls_dir.timeString,
                          process.env.FETCHER_MAXTIME ]
    })
    .then(function() {
        var okLogF = siteEntry._ls_dir.location + 'executions.log',
            content = {
                href: siteEntry._ls_links[0].href,
                href_hash: siteEntry._ls_links[0]._ls_id_hash,
                startTime: startTime.format('HH:mm:ss'),
                endTime: moment().format('HH:mm:ss'),
                startLoad: startLoad,
                endLoad: os.loadavg()[0],
                startMem: startMem,
                endMem: os.freemem()
            };
        debug("Fetch done ☞ 「%s」to 「%s」",
                moment.duration(moment().diff(startTime)).humanize(),
                siteEntry._ls_links[0].href )

        return fs
            .writeFileAsync(okLogF, JSON.stringify(content), {flag: 'w+'})
            .then(function() {
                if(siteEntry.is_present === true) {
                    debug("Multiple fetch of %s has been done",
                        siteEntry._ls_links[0].href);
                }
                siteEntry.is_present = true;
                return siteEntry;
            });
    })
    .catch(function(error) {
        debug("%s", error);
        debug("^^^^^ from %s", phantc);
        return siteEntry;
    })
};


var filesystemCheck = function(siteEntry, cnt, x) {
  /* TODO status check */
  return siteEntry;
};

var phantomCheck = function(siteEntry, cnt, x) {
  return siteEntry;
};

var progressiveStats = function(chunk, beginningT, ndx, total) {
  debugger;
  return null;
};

module.exports = function(staticInput, datainput) {
  /* This module, OR resume, has to be used. they provide:
      which is: val.source.[siteEntry].savedLog = {} */

  debug("Chain of fetch: %d sites, delay %d, concurrency %d, ETA: %s",
        _.size(datainput.source), process.env.FETCHER_DELAY,
        process.env.FETCHER_PAREX, moment.duration( 
          (15 * datainput.source.length / process.env.FETCHER_PAREX), 
          'seconds').humanize()
  );

  var chunks = _.chunk(datainput.source, 
                  _.parseInt(process.env.FETCHER_PAREX) ),
      beginningT = moment();

  return _.reduce(chunks, function (memo, chunk, ndx) {
    return memo.tap(function () {
      return progressiveStats(chunk, beginningT, ndx, 
          _.size(datainput.source));
    })
    .then(function () {
      return Promise
        .map(chunk, setupDirectory)
        .map(filesystemCheck)
        .map(performPhantom)
        .map(phantomCheck)
        .tap(function(fetchedSites) {
            datainput.source = datainput.source.concat(fetchedSites);
        });
    })
    .return(datainput);
  }, Promise.resolve());

};

module.exports.argv = {
    'fetcher.maxtime': {
        nargs: 1,
        default: 30,
        desc: 'Max amount of seconds which a web fetcher can run'
    },
    'fetcher.parex': {
        nargs: 1,
        default: 10,
        desc: '(max) parallel executions'
    },
    'fetcher.delay': {
        nargs: 1,
        default: 4.2,
        desc: 'Amount of seconds between one phantom dispatch and the next'
    }
};
