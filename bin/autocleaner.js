#!/usr/bin/env nodejs
var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var debug = require('debug')('autocleaner');
var nconf = require('nconf');

var mongo = require('../lib/mongo');

var cfgFile = "config/autocleaner.json";
var redOn = "\033[31m";
var redOff = "\033[0m";

nconf.argv()
     .env()
     .file({ file: cfgFile });
console.log(redOn + "ઉ nconf loaded, using " + cfgFile + redOff);

function countRemove(cName, timew, timevar) {
    var filter = {};
    var lastDay = moment().subtract(timew, 'd').format();
    _.set(filter, timevar, { '$lt': new Date(lastDay) });

    return mongo
        .count(cName, filter)
        .tap(function(amount) {
            debug("From column %s removing %d entries older then %d days", cName, amount, timew);
            return mongo.remove(cName, filter);
        })
        .delay(300);
}

return Promise.map(nconf.get('targets'), function(c) {
    /* c has .column .timewindow */
    return countRemove(c.collection, c.days, c.timevar);
}, {concurrency: 1})
.reduce(function(memo, amount) {
    memo += amount;
    return memo;
}, 0)
.tap(function(total) {
    debug("Deleted %d total entries", total);
});

