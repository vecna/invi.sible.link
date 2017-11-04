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
nconf.file({ file: nconf.get('config') });
nconf.file({ file: "config/campaigns.json" }); 

var tname = promises.manageOptions();

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

function saveAll(content) {
    if(_.size(content)) {
        debug("Saving in evidences %d object", _.size(content));
        return machetils.statsSave(nconf.get('schema').details, content);
    }
    else
        debug("No evidences to be saved");
}

function numerize(list) {
    debug("The list in this step has %d elements", _.size(list));
}

function clean(memo, imported) {

    var fields = [ "subjectId", "href", "kind", "promiseId", "version", "VP", "when"];

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

function saveSummary(content) {
    if(_.size(content)) {
        debug("Saving in summary %d object", _.size(content));
        return machetils.statsSave(nconf.get('schema').summary, content);
    }
    else
        debug("No summary to be saved");
};

return promises
    .retrieve(nconf.get('DAYSAGO'), tname, 'badger')
    .reduce(_.partial(promises.buildURLs, 'badger'), [])
    .tap(numerize)
    .map(machetils.jsonFetch, {concurrency: 5})
    .tap(numerize)
    .then(_.compact)
    .then(onePerSite)
    .tap(numerize)
    .reduce(clean, [])
    .tap(numerize)
    .tap(saveAll)
    .then(summary)
    .tap(numerize)
    .tap(saveSummary)
    .tap(function(r) {
        debug("Operations completed");
    });
