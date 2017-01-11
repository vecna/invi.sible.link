#!/usr/bin/env nodejs
var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('campaignChecker');

var nconf = require('nconf');
/* ¹ a great result in Keep it Simple and Stupid has 
 * caused the death of the themed componented "machete",
 * in memory of the Costa Rica vacation. now the tool
 * have a meaningful name and perfom some collection/analysis
 * operation before store to the DB. in theory, operation would
 * be more performant in mongo, so at the moment the reduction
 * is not done.  */
var mongo = require('../lib/mongo');
var machetils = require('../lib/machetils');

nconf.argv().env();
var cfgFile = nconf.get('config') || "config/campaignChecker.json";
nconf.file({ file: cfgFile });

var tname = nconf.get('campaign');
var target = _.find(nconf.get('campaigns'), { name: tname });
if(!target)
	throw new Error("specify --campaign or env `campaign`");

var taskName = nconf.get('taskName');
if(!taskName)
    throw new Error("need --taskName or env `taskName`");

debug("Task %s running for campaign %j", taskName, target);

function buildURLs(memo, page) {
	var subjectURLs = _.map(nconf.get('vantages'), function(vp) {
		var url = [ vp.host, 'api', 'v1',
					page.id, target.dayswindow, 'BSL' ].join('/');
		return {
			url: url,
			page: page.href,
			VP: vp.name,
			subjectId: page.id
        }
	});
	return _.concat(memo, subjectURLs);
};

function getSubjectURLs(target) {
    return mongo
        .read(nconf.get('schema').subjects, target.filter)
		.tap(function(alone) {
			if(_.size(alone) !== 1)
				debug("Warning! this is supposed to be 1 and only 1");
		})
        .then(_.first)
        .then(function(S) {
            debug("With filter %j we have %d subjects",
                target.filter, _.size(S.pages));
			return _.reduce(S.pages, buildURLs, []);
		});
}

function saveAll(retrieved) {
    return Promise
        .reduce(retrieved, function (memo, subject) {

            debugger;
            var target = _.head(subject.data);
            if(!target) {
                memo.missingTarget += 1;
                return memo;
            }
            memo.target += 1;
            target.macheteTiming = subject.timing;

            var fieldstrip = ['disk','phantom' ];
            var inclusions = _.map(_.tail(subject.data), function(rr) {
                return _.omit(rr, fieldstrip);
            })

            memo.data = _.concat(memo.data, target, inclusions);
            return memo;
        }, { data: [], missingTarget: 0, target: 0 })
        .then(function(content) {
            debug("saveAll has %d data, results: %d and %d missing",
                _.size(content.data), content.target, content.missingTarget);

            if(_.size(content.data)) {
                return machetils
                    .mongoSave(nconf.get('evidences'), content.data, taskName);
            }
        });
}

function updateSurface(retrieved) {
    return Promise
        .reduce(retrieved, function (memo, subject) {

            var target = _.head(subject.data);

            if(!target) {
                memo.missingTarget += 1;
                return memo;
            }
            memo.target += 1;

            /* this to keep track of the unique third party domains */
            target.unique = {};

            /* this to keep track of total javascriptps present to be analyzed */
            target.javascripts = 0;

            _.each(_.tail(subject.data), function(rr) {

                if(_.isUndefined(target.unique[rr.domainId]))
                    _.set(target.unique, rr.domainId, 0);

                target.unique[rr.domainId] += 1;

                if(rr['Content-Type'] && rr['Content-Type'].match('script')) {
                    target.javascripts += 1;
                    debug("This %s\tIS a JS", rr['Content-Type']);
                } else {
                    debug("     %s    not   Javascript", rr['Content-Type']);
                }
            });

            memo.data = _.concat(memo.data, target);
            return memo;
        }, {data: [], missingTarget: 0, target: 0 })
        .then(function(content) {
            debug("updateSurtface has %d data, results: %d and %d missing",
                _.size(content.data), content.target, content.missingTarget);

            if(_.size(content.data)) {
                return machetils
                    .mongoSave(nconf.get('surface'), content.data, taskName);
            }
        });
};

function numerize(list) {
    debug("The list in this step has %d elements", _.size(list));
}

return getSubjectURLs(target)
    .tap(numerize)
    .map(machetils.jsonFetch, {concurrency: 4})
    .tap(numerize)
    .then(_.compact)
    .tap(numerize)
    .tap(saveAll)
    .tap(updateSurface)
    .tap(function(r) {
        debug("Operationg compeleted successfully");
    });

