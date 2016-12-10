/**
 * Created by HOME on 08/12/2016.
 */
"use strict";

var _ = require('lodash');
var Promise = require('bluebird');
var util = require('util');
var request = Promise.promisifyAll(require('request'));
var fs = Promise.promisifyAll(require('fs'));
var debug = require('debug')('fixtures');
var nconf = require('nconf');
var process = require('process');
var mongo = require('../lib/mongo');
var moment = require('moment');
var various = require('../lib/various');

require('moment-isocalendar');

nconf.argv().env().file({ file: 'config/vigile.json' });

function loadJSONfile(fname) {
    debug("opening %s", fname);
    return fs
        .readFileAsync(fname, "utf-8")
        .then(JSON.parse);
}

function uniqueTargets(memo, subject) {
    var alist = _.map(subject.pages, function(site) {
        return _.pick(site, ['href', 'id', 'rank']);
    });
    var uniqued = _.uniqBy(_.concat(memo, alist), 'id');
    /* reject forcefully everything with a rank < than 100 */
    return _.reject(unique, function(entry) {
        return entry.rank < 100;
    });
}

function insertNeeds(fname) {

    return Promise
        .all([
            timeRanges(fname),
            mongo.read(nconf.get('schema').subjects)
        ])
        .then(function(inputs) {
            var targets = _.reduce(inputs[1], uniqueTargets, []);
            debugger;
        })
        .delay(2000);
}

function timeRanges(fname) {
    debug("Using %s as needs generator", fname);
    return fs
        .readFileAsync(fname, 'utf-8')
        .then(JSON.parse)
        .tap(function(content) {
            debug("content %j", content);
        })
        .then(function(content) {
            var start, end;
            debug("Processing timefram, startFrom %s (options: midnight|now), lastFor %j",
                content.lastFor, content.startFrom);
            if(content.startFrom === 'midnight') {
                debugger;
                var mins_since_midnight = moment().isocalendar()[3];
                start = moment().subtract(mins_since_midnight, 'm');
                end = moment().subtract(mins_since_midnight, 'm').add(content.lastFor.amount, content.lastFor.unit);
            } else if (content.startFrom === 'now') {
                start = moment();
                end = moment().add(content.lastFor.amount, content.lastFor.unit);
            } else {
                throw new Error("Invalid keyword in startFrom");
            }
            return {
                needName: content.needName,
                start: start.toISOString(),
                end: end.toISOString()
            };
        });
}

return insertNeeds(nconf.get('needsfile')|| 'fixtures/dailyNeeds.json');
