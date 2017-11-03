#!/usr/bin/env nodejs

var _ = require('lodash');
var debug = require('debug')('campaignLauncher');
var Promise = require('bluebird');
var moment = require('moment');
var spawnCommand = require('../lib/cmdspawn');
var path = require('path');
var nconf = require('nconf');

var ccfg = 'config/experimentsCampaign.json';
var confcamp = 'config/campaigns.json';

debug("Loading hardcoded %s", ccfg, "and", confcamp);
nconf
    .argv()
    .env()
    .file({ file: ccfg })
    .file({ file: 'config/campaigns.json' });

var done = false;

var confs = ['config/dailyBadger.json', 'config/dailyPhantom.json'];

function rollDirections(reqname) {

    if(_.startsWith(reqname, '-')) {
        reqname = _.trim(reqname, '-');
        var conflist = [ confs[1] ];
        debug("%s will be setup only for phantom", reqname);
    } else if(_.startsWith(reqname, '+')) {
        reqname = _.trim(reqname, '+');
        var conflist = [ confs[0] ];
        debug("%s will be setup only for phantom", reqname);
    } else 
        var conflist = confs;

    var found = _.find(C, { name: reqname });
    if(!found) {
        debug("Not found %s", reqname);
        return null;
    }

    var csvpath = path.join(PATH, found.cfgf);
    debug("Processing %s: %s", reqname, csvpath);

    return Promise.map(conflist, function(kindOf) {
        return spawnCommand({
            binary: '/usr/bin/env',
            args: [ 'nodejs', 'bin/directionTool.js' ],
            environment: {
                needsfile: kindOf,
                csv: csvpath,
                taskName: reqname
            }
        }, 0);
    })
    .delay(2000);
}

debugger;
var requested = _.reduce(process.argv, function(memo, e) {
    if(_.startsWith(e, 'node'))
        return memo;
    if(_.endsWith(e, 'campaignLauncher.js'))
        return memo;
    memo.push(e);
    return memo;
}, []);

if(_.size(requested) === 0) {
    console.log("Because no campaign name get provided, all are pick");
    requested = _.map(C, 'name');
}

debug("Looking for: %s, in PATH variable: %s", requested, PATH);

return Promise
    .map(requested, rollDirections, { concurrency: 1 })
    .tap(function() {
        console.log("Execution completed, wait command returns...");
    });

