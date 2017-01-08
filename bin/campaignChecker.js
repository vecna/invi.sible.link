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

var cfgFile = "config/campaignChecker.json";
nconf.argv().env().file({ file: cfgFile });

var tname = nconf.get('campaign');
var target = _.find(nconf.get('campaigns'), { name: tname });
if(!target)
	throw new Error("specify --campaign or env `campaign`");

var taskName = nconf.get('taskName');
if(!taskName)
	throw new Error("need --taskName or env `taskName`");

debug("Campaign selected is %s %d", target, target.dayswindow);

function buildURLs(memo, page) {
	var subjectURLs = _.map(nconf.get('vantages'), function(vp) {
		var url = [ vp.host, 'api', 'v1',
					page.id, target.dayswindow, 'BSL' ].join('/');
		return {
			url: url,
			name: vp.name + ' ' + page.href,
			VP: vp.name,
			subjectId: page.id
        }
	});
    debugger;
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
        })
		.tap(function(a) {
			debugger;
		});
}

return getSubjectURLs(target)
    .map(machetils.jsonFetch, {concurrency: 1})
    .then(machetils.compactList)
    .then(machetils.collectiveProcess)
    .then(function(content) {
		return machetils
			.mongoSave(nconf.get('target'), content, taskName);
	})
    .tap(function(r) {
        debug("Operationg compeleted successfully");
    });

