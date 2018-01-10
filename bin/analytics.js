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
    promises: 'when',
    accesses: 'when',
    judgment: 'when',
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
    if(!tv) {
        console.log("has to be configured " + name);
        process.exit(1);
    }

    var timestr = _.isUndefined(nconf.get('DAYSAGO')) ? 
                    moment().startOf('day').format() :
                    moment().startOf('dat').subtract(_.parseInt(nconf.get('DAYSAGO')), 'd').format();
    var timef = { "$gte": new Date(timestr) };

    var filter = _.set({}, tv, timef);
    var sort =  _.set({}, tv, -1);
    memo.push(
        mongo
            .read(column, filter, sort)
            .then(function(e) {
                if(_.size(e)) debugger;
                return {
                    sample: _.size(e) ? _.sample(e) : null,
                    count: _.size(e),
                    name: name,
                    first: _.size(e) ? _.get(_.first(e), tv) : "n/a",
                    last: _.size(e) ? _.get(_.last(e), tv) : "n/a",
                    firstTimeAgo: _.size(e) ? moment.duration(moment(_.get(_.first(e), tv)) - moment()).humanize() : "n/a",
                    lastTimeAgo: _.size(e) ? moment.duration(moment(_.get(_.last(e), tv)) - moment()).humanize() : "n/a"
                }
            })
    );
    return memo;
}, []);

return Promise.all(mongoQlist)
    .map(function(c) {
        debug("%s\t%d\tfirst [%s - %s]\tlast [%s - %s]", c.name, c.count, c.first, c.firstTimeAgo, c.last, c.lastTimeAgo);
        if(nconf.get('v') && c.sample)
            console.log(JSON.stringify(c.sample, undefined, 2));
    });
