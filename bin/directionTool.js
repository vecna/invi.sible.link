#!/usr/bin/env nodejs
var _ = require('lodash');
var Promise = require('bluebird');
var util = require('util');
var request = Promise.promisifyAll(require('request'));
var fs = Promise.promisifyAll(require('fs'));
var debug = require('debug')('directionTool');
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
        return {
            subjectId: site.id,
            href: site.href,
            rank: site.rank
        };
    });
    var uniqued = _.uniqBy(_.concat(memo, alist), 'subjectId');
    /* reject forcefully everything with a rank < than 100 */
    return _.reject(uniqued, function(entry) {
        return entry.rank > 100;
    });
}

function insertNeeds(fname) {

    var filter = nconf.get('filter') || JSON.stringify({});
    filter = JSON.parse(filter);
    return Promise
        .all([
            timeRanges(fname),
            mongo.read(nconf.get('schema').subjects, filter)
        ])
        .then(function(inputs) {
            var targets = _.reduce(inputs[1], uniqueTargets, []);
            debug("Remind, everything with rank < 100 has been stripped off");
            return _.map(targets, function(t) {
                var p = _.extend(t, inputs[0]);
                p.id = various.hash({
                    'href': p.href,
                    'start': p.start,
                    'end': p.end
                });
                return p;
            });
        })
        .then(function(needs) {
            debug("Generated %d needs", _.size(needs));
            debug("The first is %j", needs[0]);
            return mongo.writeMany(nconf.get('schema').promises, needs);
        });
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
            debug("Processing timeframe: startFrom %j (options: midnight|now), lastFor %j",
                content.lastFor, content.startFrom);
            if(content.startFrom === 'midnight') {
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
                start: new Date(start.format("YYYY-MM-DD")),
                end: new Date(end.format("YYYY-MM-DD"))
            };
        });
}

if(_.isUndefined(nconf.get('needsfile'))) {
    var fname = 'config/dailyNeeds.json';
    debug("Unspecified 'needsfile' ENV, using default %s", fname);
    return insertNeeds(fname);
} else {
    debug("needsfile: %s", nconf.get('needsfile'));
    return insertNeeds(nconf.get('needsfile'));
}
