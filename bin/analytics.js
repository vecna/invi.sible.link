#!/usr/bin/env nodejs
var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('analytics');
var nconf = require('nconf');
var process = require('process');
var moment = require('moment');

var mongo = require('../lib/mongo');
var various = require('../lib/various');
var promises = require('../lib/promises');

console.log("option -v availabe, checking last 24 hours, sort by last, specify a config file");

nconf.argv().env();
var cfg = nconf.get('config') || 'config/storyteller.json';
console.log("config file: " + cfg);
nconf.file({ file: cfg });

var timeVar = {
    promises2: 'start',
    accesses: 'when',
    statistics: null,
    surface: 'when',
    evidences: 'when',
    details: 'when',
    summary: 'when',
    badger: 'when',
    phantom: 'requestTime',
    sankeys: 'when'
};

var mongoQlist = _.reduce(nconf.get('schema'), function(memo, column, name) {
    var tv = _.get(timeVar, name);
    if(_.isNull(tv)) {
        debug("skipping %s", name);
        return memo;
    }
    if(!tv)
        throw new Error("has to be configured " + name);

    var timestr = _.isUndefined(nconf.get('DAYSAGO')) ? 
                    moment().subtract(24, 'h').format() :
                    moment().subtract(_.parseInt(nconf.get('DAYSAGO')), 'd').format();
    var timef = { "$gt": new Date(timestr) };

    var filter = _.set({}, tv, timef);
    var sort =  _.set({}, tv, -1);
    memo.push(
        mongo
            .read(column, filter, sort)
            .then(function(e) {
                return {
                    sample: e[0],
                    count: _.size(e),
                    name: name
                }
            })
    );
    return memo;
}, []);

return Promise.all(mongoQlist)
    .map(function(c) {
        debug("%s\t%d", c.name, c.count);
        if(nconf.get('v'))
            console.log(JSON.stringify(c.sample, undefined, 2));
    });
