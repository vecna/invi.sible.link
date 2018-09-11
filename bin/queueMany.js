#!/usr/bin/env node
var _ = require('lodash');
var debug = require('debug')('bin:queueMany');
var Promise = require('bluebird');
var moment = require('moment');
var nconf = require('nconf');

var queue = require('../lib/queue');

var confcamp = 'config/campaigns.json';
debug("Loading hardcoded", confcamp);

nconf.argv().env().file({ file: confcamp });

var campaigns = nconf.get('campaigns');
var campaignSequence = [];

_.each(campaigns, function(campaign, cname) {
    /* campaign is the campaign name, if exists in nconf, is because it is specify with --campaignName */
    if(nconf.get(cname)) {
        var cinfo = _.get(campaigns, cname);
        debug("Starting campaign %s, composed by %d files", cname, _.size(cinfo) );
        campaignSequence = _.concat(campaignSequence,
                                    queue.prepareCampaign(cname, cinfo));
    }
});

if(!_.size(campaignSequence)) {
    console.log("Because no campaign name get provided, all are pick");
    _.each(campaigns, function(cinfo, cname) {
        campaignSequence = _.concat(campaignSequence,
                                    queue.prepareCampaign(cname, cinfo));
    });
}

nconf.argv().env().file({ file: 'config/vigile.json' });

debug("There are %d files to be commited", _.size(campaignSequence));
return Promise.map(campaignSequence, function(centry) {
    return queue
        .csvToDirectives(centry.csv, ["basic", "badger"], centry.name)
        .then(queue.add)
})
.then(_.flatten)
.then(queue.report);
