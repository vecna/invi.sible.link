#!/usr/bin/env nodejs
var _ = require('lodash');
var debug = require('debug')('bin:csvoperations');
var moment = require('moment');
var nconf = require('nconf');

var queue = require('../lib/queue');

nconf.argv().env().file({ file: 'config/vigile.json' });

/* variable imports */
csvfile = nconf.get('csv');
campaign = nconf.get('campaign');
if(!csvfile || !campaign) {
    console.log("required --csv and --campaign");
    process.exit(1);
}

/* TODO, do also an option to flush the campaign from DB to CSV */
return queue
    .importSiteFromCSV(csvfile)
    .migrationSiteList(campaign);
