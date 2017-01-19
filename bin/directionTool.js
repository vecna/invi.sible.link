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

nconf.argv().env().file({ file: 'config/vigile.json' });

function loadJSONfile(fname) {
    debug("opening %s", fname);
    return fs
        .readFileAsync(fname, "utf-8")
        .then(JSON.parse);
}

/* uniqueTargets _.reduce every source: DB or CSV */
function uniqueTargets(memo, subject) {
    var taskName = nconf.get('taskName') || "forgetten";
    var alist = _.map(subject.pages, function(site) {
        return {
            subjectId: site.id,
            href: site.href,
            rank: site.rank,
            taskName: taskName
        };
    });
    var uniqued = _.uniqBy(_.concat(memo, alist), 'subjectId');
    /* reject forcefully everything with a rank < than 100 */
    return _.reject(uniqued, function(entry) {
        return entry.rank > 100;
    });
}

function insertNeeds(fname, csv) {

    var filter = nconf.get('filter') || JSON.stringify({});
    filter = JSON.parse(filter);
    var taskName = nconf.get('taskName') || "forgetten";
    var promises = [ timeRanges(fname) ];

    if(csv) {
        throw new Error("Not yet implemented CSV");
    } else {
        /* if database source */
        promises.push( mongo.read(nconf.get('schema').subjects, filter) );
    }

    return Promise
        .all(promises)
        .then(function(inputs) {
            /* uniqueTargets process every source: DB or CSV */
            var targets = _.reduce(inputs[1], uniqueTargets, []);
            debug("taskName: %s Remind, everything with rank < 100 has been stripped off",
                taskName);
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
            debug("The first is %s", JSON.stringify(needs[0], undefined, 2) );
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
                start = moment().startOf('day');
                end = moment().startOf('day').add(content.lastFor.amount, content.lastFor.unit);
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


csv = nconf.get('csv');
if(csv)
    debug("CSV source defined in %s, I hope is an absolute path", csv);

if(_.isUndefined(nconf.get('needsfile'))) {
    var fname = 'config/dailyNeeds.json';
    debug("Unspecified 'needsfile' ENV, using default %s", fname);
    return insertNeeds(fname, csv);
} else {
    debug("needsfile: %s", nconf.get('needsfile'));
    return insertNeeds(nconf.get('needsfile'), csv);
}
