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
    var taskName = nconf.get('taskName') || "u-forgot-taskName";
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

function windowsOrUnix(content) {
    var lines = content.split('\r\n');
    if(_.size(lines) === 1)
        lines = content.split('\n');
    return lines;
}

function importCSV(fname) {

    var taskName = nconf.get('taskName') || "u-forgot-taskName";
    return fs
        .readFileAsync(fname, 'utf-8')
        .then(function(csvc) {
            var lines = windowsOrUnix(csvc);
            debug("%d lines → keys [%s] 'rank' will be add",
                _.size(lines)-1, lines[0] );
            return _.map(_.tail(lines), function(entry, i) {
                var comma = entry.indexOf(',');
                return {
                    'subjectId': various.hash({
                        'fname': fname,
                        'content': csvc,
                        'name': taskName
                    }),
                    'taskName': taskName,
                    'href': entry.substring(0, comma),
                    'description': _.trim(entry.substring(comma+1), '"'),
                    'rank': i + 1
                };
            });
        });
};

function insertNeeds(fname, csv) {

    var filter = nconf.get('filter') || JSON.stringify({});
    filter = JSON.parse(filter);
    var promises = [ timeRanges(fname) ];

    if(csv) {
        debug("Importing CSV %s", csv);
        promises.push( importCSV(csv) );
    } else {
        debug("Using mongo as source (%j)", filter);
        promises.push( 
            mongo
                .read(nconf.get('schema').subjects, filter)
                .reduce(uniqueTargets, [])
        );
    }

    return Promise
        .all(promises)
        .then(function(inputs) {
            debug("Read %d sites, everything with rank < 100 will be stripped off",
                _.size(inputs[1]) );
            /* TODO check that CSV and DB are producing here the same output */
            return _.map(inputs[1], function(t) {
                var p = _.extend(t, inputs[0]);
                p.id = various.hash({
                    'href': p.href,
                    'start': p.start,
                    'end': p.end
                });
                return p;
            });
        })
        .then(function(tobecheck) {
            var uniquified = _.countBy(tobecheck, 'id');
            return _.reduce(uniquified, function(memo, amount, id) {
                if(amount === 1)
                    return _.concat(memo, _.find(tobecheck, {id: id}));

                debug("Duplicated (%d times) %j", amount, _.find(tobecheck, {id: id}));
                return _.concat(memo, _.first(_.find(tobecheck, {id: id})));
            }, []);
        })
        .then(_.compact)
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
            debug("Timeframe: startFrom %s (midnight|now), lastFor %j",
                content.startFrom, content.lastFor);
            if(content.startFrom === 'midnight') {
                start = moment()
                    .startOf('day');
                end = moment()
                    .startOf('day')
                    .add(content.lastFor.number, content.lastFor.period);

            } else if (content.startFrom === 'now') {
                start = moment();
                end = moment()
                    .add(content.lastFor.number, content.lastFor.period);
            } else {
                throw new Error("Invalid keyword in startFrom");
            }
            debug("Window start %s end %s", start, end);
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
