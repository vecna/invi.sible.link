#!/usr/bin/env nodejs
var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('analyzeBadger');

var moment = require('moment');
var nconf = require('nconf');

var mongo = require('../lib/mongo');
var various = require('../lib/various');
var machetils = require('../lib/machetils');
var company = require('../lib/company');
var promises = require('../lib/promises');

/* ENV/options init */
nconf.argv().env();
if(!nconf.get('config')) { console.log("--config is necessary"); return }
/* tname uses config/campaigns.json */
var tname = promises.manageOptions();
nconf.argv().env().file('config/storyteller.json').file('vantages', nconf.get('config') );


/* still to be decided how to clean this */
var whenD = nconf.get('DAYSAGO') ?
    moment()
        .startOf('day')
        .subtract(_.parseInt(nconf.get('DAYSAGO')), 'd')
        .toISOString() :
    moment()
        .startOf('day')
        .toISOString();
debug("Saving date set to: %s", whenD);

/* code begin here */
function onePerSite(retrieved) {

    var pages = _.uniq(_.map(retrieved, 'page'));
    debug("onePerSite, pages available: %d", _.size(pages));

    /* every Vantage Point might have a proper analysis, some
     * with less data, some with more. here is kept only the
     * result with more retrieved third parties */
    return _.reduce(retrieved, function(memo, s) {
        var exists = _.find(memo, { page: s.page });

        if(exists) {
            if( _.size(exists.data) > _.size(s.data) )
                return memo;
            memo = _.reject(memo, { page: s.page });
        }
        memo.push(s);
        return memo;
    }, []);
};

function saveSummary(content) {
	debug("elements to be saved in `summary` are: %d", _.size(content));
    return Promise
        .map(content, function(e) {
            return mongo
                .read(nconf.get('schema').summary, { id: e.id })
                .then(_.first)
			    .tap(function(result) {
        			if(_.isUndefined(result))
                    	return mongo.writeOne(nconf.get('schema').summary, e)
                });
        }, {concurrency: 5})
		.then(_.compact)
		.tap(function(saved) {
			debug("The elements saved in `summary` are %d", _.size(saved));
		});
}

function saveAll(content) {
	debug("elements to be saved in `details` are: %d", _.size(content));
    return Promise
        .map(content, function(e) {
            return mongo
                .read(nconf.get('schema').details, { id: e.id })
                .then(_.first)
			    .tap(function(result) {
        			if(_.isUndefined(result))
                    	return mongo.writeOne(nconf.get('schema').details, e)
                });
        }, {concurrency: 5})
		.then(_.compact)
		.tap(function(saved) {
			debug("The elements saved in `details` are %d", _.size(saved));
		});
}

function clean(memo, imported) {

    var fields = [ "testId", "href", "kind", "promiseId", "version", "VP", "when"];

    _.each(imported.data, function(entry) {

        entry.scriptacts = _.reduce(_.omit(entry, _.concat(fields, ['inclusion'])),
            function(memo, amount, kind) {
                memo += amount;
                return memo;
            }, 0);

        /* inclusion + fingerprinting: execution order MATTER! */
        entry.scriptHash = various.hash(_.omit(entry, fields));

        entry.acquired = new Date(entry.when);
        entry.when = new Date(whenD);
        entry.campaign = tname;
        entry.id = various.hash({
            today: moment().format("YYYY-mm-DD"),
            subject: entry.subjectId
        })

        memo.push(entry);
    });
    return memo;
};

function summary(detailsL) {
    /* 1) retrieve details of the previous day(s),
     * 2) outline few statistics, ranks, values
     * 3) write into the DB
     */

    return _.reduce(_.groupBy(detailsL, 'href'), function(memo, evidences, href) {

        if(!_.size(evidences))
            return memo;

        var small = {
            href: href,
            when: new Date(whenD),
            campaign: evidences[0].campaign,
            js: []
        };

        var fixedf = ['inclusion', 'href', 'kind',
                      'promiseId', 'version', 'VP', 'when', 'scriptacts',
                      'scriptHash', 'acquired', 'campaign', 'id', '_id' ];

        _.each(evidences, function(e) {
            var x = { source: e.inclusion, behavior: _.omit(e, fixedf) };
            small.js.push(x);
        });
        memo.push(small);
        return memo;
    }, []);
};

return promises
    .retrieve(nconf.get('DAYSAGO'), tname, 'badger')
    .reduce(_.partial(promises.buildURLs, 'badger'), [])
    .tap(machetils.numerize)
    .map(machetils.jsonFetch, {concurrency: 5})
    .tap(machetils.numerize)
    .then(_.compact)
    .then(onePerSite)
    .tap(machetils.numerize)
    .reduce(clean, [])
    .tap(machetils.numerize)
    .tap(saveAll)
    .then(summary)
    .tap(machetils.numerize)
    .tap(saveSummary)
    .tap(function(r) {
        debug("Operations completed");
    });
