var _ = require('lodash');
var debug = require('debug')('route:getCampaignNames');
var pug = require('pug');
var nconf = require('nconf').env();
var fs = require('../lib/fs');

var getCampaignNames = function(req) {

    debug("getCampaignNames");
    return fs
        .readPromise('config/campaignChecker.json')
        .then(function(c) {
            return { 'json': _.map(c.campaigns, 'name') };
        });
};

module.exports = getCampaignNames;
