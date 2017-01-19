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
var company = require('../lib/company');

nconf.argv().env();

var cfgFile = nconf.get('config') 
if(!cfgFile)
    throw new Error("config file has to be explicit and full path here");
nconf.file({ file: cfgFile });

var tname = nconf.get('campaign');
debug("using target name %s to be search in %j", tname, nconf.get('campaigns'));
if(!tname)
	throw new Error("specify --campaign or env `campaign`");
var target = _.find(nconf.get('campaigns'), { name: tname });
if(!target)
	throw new Error("Not found campagin " + tname + " in config section");

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
    /* note: correctly is returning only the subjects tested,
     * not all the subject, for example, < 100 are skipped */
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

            var target = _.find(subject.data, {target: true})
            if(!target)
                return memo;

            target.macheteTiming = subject.timing;

            /* these fields are kept in target only ATM, TODO cleaning or remove this 4 lines */
            var fieldstrip = ['disk','phantom' ];
            var inclusions = _.map(_.reject(subject.data, {target: true}), function(rr) {
                return _.omit(rr, fieldstrip);
            })

            return _.concat(memo, target, inclusions);
        }, [])
        .then(function(content) {
            debug("saveAll has %d data", _.size(content));

            if(_.size(content)) {
                return machetils
                    .mongoSave(nconf.get('evidences'), content, taskName);
            }
        });
}

function updateSurface(retrieved) {
    return Promise
        .reduce(retrieved, function (memo, subject, i, total) {

            /*
            > _.keys(subject)
            [ 'url', 'page', 'VP', 'subjectId', 'data', 'timing' ]
            > subject.url
            'http://localhost:7300/api/v1/65bdefee473b2aa910ff52efdcb0425f3d4201d6/3/BSL'
            > subject.data
            [ { url: 'https://www.google.com.br/images/nav_logo242.png',
                requestTime: '2017-01-18T11:43:55.515Z',                         */

            var target = _.find(subject.data, {target: true})
            if(!target)
                return memo;

            /* this to keep track of the unique third party domains */
            target.unique = {};
            /* this to keep track of total javascriptps present to be analyzed */
            target.javascripts = 0;

            _.each(_.reject(subject.data, {target: true}), function(rr) {

                if(_.isUndefined(target.unique[rr.domainId]))
                    _.set(target.unique, rr.domainId, 0);

                target.unique[rr.domainId] += 1;

                if(rr['Content-Type'] && rr['Content-Type'].match('script'))
                    target.javascripts += 1;
            });

            return _.concat(memo, target);
        }, [])
        .then(function(content) {
            debug("updateSurtface has %d data (has to be ~ subjects)",
                _.size(content) );

            if(_.size(content)) {
                return machetils
                    .mongoSave(nconf.get('surface'), content, taskName);
            }
        });
};

function numerize(list) {
    debug("The list in this step has %d elements", _.size(list));
}

return getSubjectURLs(target)
    .tap(numerize)
    .map(machetils.jsonFetch, {concurrency: 10})
    .tap(numerize)
    .then(_.compact)
    .tap(numerize)
    .map(company.attribution)
    .tap(saveAll)
    .tap(updateSurface)
    .tap(function(r) {
        debug("Operationg compeleted successfully");
    });

