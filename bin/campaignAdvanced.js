#!/usr/bin/env nodejs
var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('campaignAdvanced');

var moment = require('moment');
var nconf = require('nconf');

var mongo = require('../lib/mongo');
var various = require('../lib/various');
var machetils = require('../lib/machetils');
var company = require('../lib/company');
var promises = require('../lib/promises');

nconf.argv().env();

var cfgFile = nconf.get('config');
if(!cfgFile) machetils.fatalError("config file has to be specify via CLI/ENV");

nconf.file({ file: cfgFile });

debug("campaign available %j", _.map(nconf.get('campaigns'), 'name'));

var tname = nconf.get('campaign');
if(!tname) machetils.fatalError("campaign has to be specify via CLI/ENV");

debug("Looking for campaign %s", tname);

var campConf = _.find(nconf.get('campaigns'), { name: tname });
if(!campConf) machetils.fatalError("Not found campagin " + tname + " in config section");

function buildURLs(memo, page) {
	var promiseURLs = _.map(nconf.get('vantages'), function(vp) {
		var url = [ vp.host, 'api', 'v1',
					page.id, 'badger', 'BP' ].join('/');
		return {
			url: url,
			page: page.href,
			VP: vp.name,
			subjectId: page.id
        }
	});
	return _.concat(memo, promiseURLs);
};

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

function getPromiseURLs(target) {
    return promises
        .retrieve(nconf.get('DAYSAGO'), target.filter)
        .tap(function(p) {
            debug("Promises by %j: %d results (~ %d per day)",
                target.filter, _.size(p),
                _.round(_.size(p) / target.dayswindow, 2) );
        })
        .reduce(buildURLs, []);
}

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

    var fields = [ "subjectId", "href", "needName", "promiseId", "version", "VP", "when"];

    _.each(imported.data, function(entry) {

        entry.scriptacts = _.reduce(_.omit(entry, _.concat(fields, ['inclusion'])),
            function(memo, amount, kind) {
                memo += amount;
                return memo;
            }, 0);

        /* inclusion + fingerprinting: execution ordeer MATTER! */
        entry.scriptHash = various.hash(_.omit(entry, fields));

        entry.acquired = new Date(entry.when);
        entry.when = new Date();
        entry.campaign = tname;
        entry.id = various.hash({
            today: moment().format("YYYY-mm-DD"),
            subject: entry.subjectId
        })

        memo.push(entry);
    });
    return memo;
};

return getPromiseURLs(campConf)
    .tap(numerize)
    .map(machetils.jsonFetch, {concurrency: 5})
    .tap(numerize)
    .then(_.compact)
    .then(onePerSite)
    .tap(numerize)
    .reduce(clean, [])
    .tap(numerize)
    .tap(saveAll)
    .tap(function(r) {
        debug("Operationg compeleted successfully");
    });
