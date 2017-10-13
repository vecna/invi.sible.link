#!/usr/bin/env nodejs
var _ = require('lodash');
var Promise = require('bluebird');
var util = require('util');
var request = Promise.promisifyAll(require('request'));
var fs = Promise.promisifyAll(require('fs'));
var debug = require('debug')('directionTool');
var nconf = require('nconf');
var process = require('process');
var moment = require('moment');

var mongo = require('../lib/mongo');
var various = require('../lib/various');
var promises = require('../lib/promises');

nconf.argv().env().file({ file: 'config/vigile.json' });

function insertNeeds(fname, csv) {

    var filter = nconf.get('filter') || JSON.stringify({});
    filter = JSON.parse(filter);

    var taskName = nconf.get('taskName');
    if(!taskName)
        throw new Error("taskName variable it is required");

    return readConfig(fname, taskName)
        .then(function(inputc) {
            debug("Importing CSV %s", csv);
            return importCSV(inputc, csv);
        })
        .then(function(needs) {
            debug("Generated %d needs", _.size(needs));
            debug("The first is %s", JSON.stringify(needs[0], undefined, 2) );
            return mongo.writeMany(nconf.get('schema').promises, needs);
        });
};

function windowsOrUnix(content) {
    var lines = content.split('\r\n');
    if(_.size(lines) === 1)
        lines = content.split('\n');
    return lines;
}

function importCSV(configi, fname) {

    return fs
        .readFileAsync(fname, 'utf-8')
        .then(function(csvc) {
            var lines = windowsOrUnix(csvc);
            debug("%d lines → keys <%s> 'rank' will be add",
                _.size(lines)-1, lines[0] );

            return _.reduce(_.tail(lines), function(memo, entry, i) {

                var comma = entry.split(',');

                if(_.size(comma) != 2 || _.size(comma[0]) < 7 ) {
                    debug("nope? %d", i);
                    return memo;
                }

                var imported = _.extend({}, configi, {
                    'href': comma[0],
                    'rank': i + 1
                });

                if(_.size(comma[1]) > 2) {
                    var d = _.trim(comma[1], '"');
                    imported.description = d;
                }
                else
                    imported.description = "";

                imported.id = various.hash({
                    'href': imported.href,
                    'type': configi.needName,
                    'start': imported.start,
                });
                imported.subjectId = various.hash({
                    'target': imported.href,
                    'campaign': configi.taskName
                });
                memo.push(imported);
                return memo;
            }, []);
        })
        .then(function(c) {
            return _.sortBy(c, 'rank');
        });
};


function readConfig(fname, taskName) {
    debug("Using %s as needs generator", fname);
    return fs
        .readFileAsync(fname, 'utf-8')
        .then(JSON.parse)
        .tap(function(configc) {
            debug("config content %j", configc);
        })
        .then(function(content) {
            var start;
            debug("Timeframe: startFrom %s (midnight), lastFor %j",
                content.startFrom, content.lastFor);
            if(content.startFrom === 'midnight') {
                start = moment().startOf('day');
            } else {
                throw new Error("Invalid keyword in startFrom");
            }
            debug("Window start %s", start);
            return {
                needName: content.needName,
                start: new Date(start.format("YYYY-MM-DD")),
                taskName: taskName
            };
        });
};

csv = nconf.get('csv');
if(!csv) {
    console.log("missinfg csv option");
    process.exit(1);
}

if(_.isUndefined(nconf.get('needsfile'))) {
    debug("Unspecified 'needsfile': required!");
    process.exit(1);
}

debug("CSV source defined in %s, I hope is an absolute path", csv);
debug("needsfile: %s", nconf.get('needsfile'));
return insertNeeds(nconf.get('needsfile'), csv);
