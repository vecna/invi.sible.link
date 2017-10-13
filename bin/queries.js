#!/usr/bin/env nodejs
var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('campaignChecker');

var moment = require('moment');
var nconf = require('nconf');

var mongo = require('../lib/mongo');
var campaignOps = require('../lib/campaignOps');

nconf.argv().env();

var cfgFile = nconf.get('config');

nconf.file({ file: cfgFile });

var company = nconf.get('company');

return mongo
    .aggregate(nconf.get('schema').evidences, 
        { 
            "company": company,
            "requestTime": { "$gt": new Date("2017-07-01") } 
        },  
        {
            _id: { url: "$href", campaign: "$campaign" },
            count: { $sum:1 }
        }
    )
    .then(function(x) {
        debug("%d", _.size(x));
        _.each(_.reverse(_.sortBy(x, 'count')), function(e) {
            console.log(e['_id'].url, e['_id'].campaign);
        });
    });
