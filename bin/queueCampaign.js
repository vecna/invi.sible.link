#!/usr/bin/env nodejs
var _ = require('lodash');
var debug = require('debug')('bin:queueCampaign');
var moment = require('moment');
var nconf = require('nconf');

var queue = require('../lib/queue');
var accepted = [ "basic", "badger", "urlscan" ];

nconf.argv().env().file({ file: 'config/vigile.json' });

/* variable imports */
csvfile = nconf.get('csv');
campaign = nconf.get('campaign');
if(!csvfile || !campaign) {
    console.log("required --csv and --campaign, optional --kind");
    console.log(accepted);
    process.exit(1);
}

var testkind = nconf.get('kind');

if(!testkind) {
    testkind = [ "basic", "badger" ];
    debug("using both the kind: %s", testkind);
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
