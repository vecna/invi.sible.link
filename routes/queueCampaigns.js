var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('route:queueCampaigns');
var moment = require('moment');
var nconf = require('nconf');
 
var queue = require('../lib/queue');
var various = require('../lib/various');

/* This API initialize the queue of promises for the day */
function queueCampaigns(req) {

    debug("queueCampaigns, loading 'config/campaigns.json'");
    return various
        .loadJSONfile('config/campaigns.json')
        .then(function(campaigns) {
            var campaignSequence = [];
            _.each(campaigns.campaigns, function(cinfo, cname) {
                campaignSequence = _.concat(campaignSequence,
                                            queue.prepareCampaign(cname, cinfo));
            });
            return campaignSequence;
        })
        .map(function(centry) {
            return queue
                .csvToDirectives(centry.csv, ["basic", "badger"], centry.name)
                .then(queue.add)
        }, {concurrency: 1})
        .then(_.flatten)
        .tap(queue.report)
        .then(function(proms) {
            var ret = _.countBy(proms, 'campaign');
            if(!_.size(ret))
                return { json: { "message": "All the campaigns looks already in queue"}};
            return { json: ret };
        });
};

module.exports = queueCampaigns;
