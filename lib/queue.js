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

function buildDirective(testkind, time, url, campaign, description, counter) {

    return {
        kind: testkind,
        start: new Date(moment(time).startOf('day').format("YYYY-MM-DD")),
        id: various.hash({
            'href': url,
            'needName': testkind,
            'campaign': campaign,
            'start': moment(time).startOf('day').format("YYYY-MM-DD")
        }),
        href: url,
        campaign: campaign,
        when: new Date(moment(time).toISOString()),
        description: description,
        rank: counter,
        subjectId: various.hash({
            'campaign': campaign,
            'start': moment(time).startOf('day').format("YYYY-MM-DD")
        })
    };
}

function csvToDirectives(csvfile, testkind, campaign) {

	function windowsOrUnix(content) {
		var lines = content.split('\r\n');
		if(_.size(lines) === 1)
			lines = content.split('\n');
		return lines;
	}

	return fs
		.readFileAsync(csvfile, 'utf-8')
		.then(function(csvc) {
			var lines = windowsOrUnix(csvc);
			debug("%d lines → keys <%s> 'rank' will be add",
				_.size(lines)-1, lines[0] );

			return _.reduce(_.tail(lines), function(memo, entry, i) {

				var site = _.first(entry.split(','));

				if(_.size(site) < 7 ) {
					debug("nope? %d", i);
					return memo;
				}

				var imported = {
					'href': _.trim(site, '"'),
					'rank': i + 1,
					'description': ''
				};

				if(_.size(comma[1]) > 2) {
					var d = _.trim(comma[1], '"');
					imported.description = d;
				}

				memo.push(imported);
				return memo;
			}, [])
		})
		/* manage the test kinds, duplicare or not.. */
		.map(function(site) {
			return _.map(testkind, function(t) {
				return _.merge({ type: t}, site);
			});
		})
		.then(_.flatten)
		.map(function(site) {
			return buildDirective(site.type, moment(), site.href, campaign, site.description, site.rank);
		});
}

function add(sequence) {
    return Promise
        .map(sequence, checkIfExists, { concurrency: 1})
        .then(_.compact)
        .then(saveMany)
        .tap(function(x) {
            debug("added %d promises", _.size(x));
        });

};

function checkIfExists(obj) {
    return mongo
        .read(nconf.get('schema').promises, { id: obj.id })
        .then(function(exists) {
            if(_.get(exists[0], 'id')  === obj.id)
                return null;

            return obj;
        });
}

function saveMany(sequence) {
    if(!_.size(sequence)) return [];
    return mongo
        .writeMany(nconf.get('schema').promises, sequence)
        .return(sequence);
};

function report(sequence) {
    if(!_.size(sequence))
        debug("No object reach this point");
    else
        debug("%d object, first is %s",
            _.size(sequence),
            JSON.stringify(sequence[0], undefined, 2));
};

/*
return various
    .loadJSONfile(remote)
    .tap(function(c) {
        if(!c.server || !_.size(c.server)) {
            console.log("The json file as 'remote' do not contains key: server");
            // others key expected: 'url'
            process.exit(1);
        }
    })
    .then(function(c) {
        var url = c.server + c.url;
        return various.loadJSONurl(url);
    })
    .map(addNewHrefs, { concurrency: 1})
    .then(_.flatten)
    .then(_.compact)
    .tap(function(content) {
        if(content && _.size(content))
            debug("The first of %d is %s",
                _.size(content), JSON.stringify(content[0], undefined, 2));
        else
            debug("Empty list: all duplicates?");
    })
    .map(function(doc) {
        return mongo
            .save(nconf.get('schema').promises, doc);
    }, {concurrency: 1});

*/

module.exports = {
    buildDirective: buildDirective,
	csvToDirectives: csvToDirectives,
    add: add,
    checkIfExists: checkIfExists,
    report: report
};
