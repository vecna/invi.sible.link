#!/usr/bin/env node
var _ = require('lodash');
var debug = require('debug')('bin:csvoperations');
var moment = require('moment');
var nconf = require('nconf');

var csv = require('../lib/csv');
var queue = require('../lib/queue');

nconf.argv().env().file({ file: 'config/storyteller.json' });

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
    .then(function(sites) {
        return csv.migrationSiteList(sites, campaign);
    })
