#!/usr/bin/env nodejs
var _ = require('lodash');
var Promise = require('bluebird');
var util = require('util');
var request = Promise.promisifyAll(require('request'));
var fs = Promise.promisifyAll(require('fs'));
var debug = require('debug')('lib:csv');
var nconf = require('nconf');
var process = require('process');
var moment = require('moment');
var path = require('path');

var mongo = require('../lib/mongo');
var various = require('../lib/various');

nconf.argv().env().file({ file: 'config/storyteller.json' });

function migrationSiteList(sites, campaign) {

    debug("migrationSiteList pick files from external sources and update the `sites` collection, campaign %s", campaign);
    return mongo
        .read(nconf.get('schema').sites, { campaign: campaign }, { start: -1})
        .then(function(present) {
            debug("currently present %s sites in %s campaign", _.size(present), campaign);
            return _.reduce(sites, function(memo, csventry) {

                if(_.find(memo, { href: csventry.href }))
                    return memo;

                memo.push({
                    campaign: campaign,
                    start: new Date(),
                    href: csventry.href,
                    id: various.hash({
                        href: csventry.href,
                        campaign: campaign
                    }),
                    description: csventry.description,
                    lastSurfId: undefined,
                    lastChecked: undefined,
                    frequency: 3
                });
                return memo;
            }, present);
        })
        .map(function(entry) {
            return mongo
                .read(nconf.get('schema').sites, { id: entry.id })
                .then(function(content) {
                    if(content[0] && content[0].id)
                        return null;
                    return mongo
                        .writeOne(nconf.get('schema').sites, entry)
                        .return(true);
                })
                .catch(function(error) {
                    debug("Error with %s: %s", entry.href, error);
                    return false;
                });
            
        }, {concurrency: 1})
        .then(_.compact)
        .then(_.size)
        .then(function(updated) {
            debug("The campaign %s got updated of %d sites (now you should use queueOPush)", campaign, updated);
        });
};

function register(entry) {

    entry.lastSurfId = undefined;
    entry.lastChecked = undefined;

    debug("register in `sites` of %s", entry.href);
    return mongo
        .read('sites', { id: entry.id })
        .then(function(content) {
            if(content[0] && content[0].id)
                return null;
            return mongo
                .writeOne('sites', entry)
                .return(true);
        })
        .catch(function(error) {
            debug("Error with %s: %s", entry.href, error);
            return false;
        });

}

module.exports = {
    migrationSiteList: migrationSiteList,
    register: register
};
