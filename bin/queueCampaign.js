#!/usr/bin/env nodejs
var _ = require('lodash');
var debug = require('debug')('bin:queueCampaign');
var moment = require('moment');
var nconf = require('nconf');

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

var testkind = nconf.get('kind');

var accepted = [ "basic", "badger", "urlscan" ] ;
if(!testkind) {
    testkind = [ "basic", "badger" ];
} else {
    if(accepted.indexOf(testkind) === -1) {
        console.log("Error, you requested an invalid --kind", testkind, "accepted:", accepted);
        process.exit(1);
    }
    testkind = [ testkind ];
}

/* here it begins */
return queue
    .csvToDirectives(csvfile, testkind, campaign)
    .then(queue.add)
    .tap(queue.report);
