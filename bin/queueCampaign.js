#!/usr/bin/env nodejs
var _ = require('lodash');
var Promise = require('bluebird');
var util = require('util');
var request = Promise.promisifyAll(require('request'));
var fs = Promise.promisifyAll(require('fs'));
var debug = require('debug')('directionTool');
var nconf = require('nconf');
var process = require('process');
var moment = require('moment');

var mongo = require('../lib/mongo');
var various = require('../lib/various');
var promises = require('../lib/promises');
var queue = require('../lib/queue');

nconf.argv().env().file({ file: 'config/vigile.json' });

/* variable imports */
csvfile = nconf.get('csv');
if(!csvfile) {
    console.log("missinfg --csv option");
    process.exit(1);
}

campaign = nconf.get('campaign');
if(!campaign) {
    console.log("missinfg --campaign option");
    process.exit(1);
}

var testkind = nconf.get('type');

var accepted = [ "basic", "badger", "urlscan" ] ;
if(!testkind) {
    testkind = [ "basic", "badger" ];
} else {
    if(accepted.indexOf(testkind) === -1) {
        console.log("Error, you requested an invalid --type", testkind, "accepted:", accepted);
        process.exit(1);
    }
    testkind = [ testkind ];
}

/* here it begins */
return queue
    .csvToDirectives(csvfile, testkind, campaign)
    .then(queue.add)
    .tap(queue.report);
