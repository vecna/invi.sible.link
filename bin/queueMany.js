#!/usr/bin/env nodejs
var _ = require('lodash');
var debug = require('debug')('bin:queueMany');
var Promise = require('bluebird');
var moment = require('moment');
var path = require('path');
var nconf = require('nconf');
var fs = require('fs');

var queue = require('../lib/queue');

var confcamp = 'config/campaigns.json';
debug("Loading hardcoded", confcamp);

nconf.argv().env().file({ file: confcamp });

var campaigns = nconf.get('campaigns');
var campaignSequence = [];

function csvExists(root, fname) {
    var testp = path.join(root, fname);
    return fs.existsSync(testp) ? testp : null;
};

function prepareCampaign(cname, cinfo) {
    /* not exactly the best, but I avoided loop because the same file was appearing twice */
    var paths = [ '../campaigns', './campaigns/', '../' ];
    return _.reduce(cinfo, function(memo, centry) {

        var z = csvExists(paths[0], centry.csv);
        var o = csvExists(paths[1], centry.csv);
        var t = csvExists(paths[2], centry.csv);

        if(z)
            memo.push({ macro: cname, name: centry.name, csv: z });
        else if(o)
            memo.push({ macro: cname, name: centry.name, csv: o });
        else if(t)
            memo.push({ macro: cname, name: centry.name, csv: t });
        else
            debug("Path not found for campaing %s", centry.name);
        return memo;

    }, []);
}

_.each(campaigns, function(campaign, cname) {
    /* campaign is the campaign name, if exists in nconf, is because it is specify with --campaignName */
    if(nconf.get(cname)) {
        var cinfo = _.get(campaigns, cname);
        debug("Starting campaign %s, composed by %d files", cname, _.size(cinfo) );
        campaignSequence = _.concat(campaignSequence, prepareCampaign(cname, cinfo) );
    }
});

if(!_.size(campaignSequence)) {
    console.log("Because no campaign name get provided, all are pick");
    _.each(campaigns, function(cinfo, cname) {
        campaignSequence = _.concat(campaignSequence, prepareCampaign(cname, cinfo));
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
