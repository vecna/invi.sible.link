#!/usr/bin/env nodejs
var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('campaignChecker');

var moment = require('moment');
var nconf = require('nconf');
var mongo = require('../lib/mongo');

/* ¹ a great result in Keep it Simple and Stupid has 
 * caused the death of the themed componented "machete",
 * in memory of the Costa Rica vacation. now the tool
 * have a meaningful name and perfom some collection/analysis
 * operation before store to the DB. in theory, operation would
 * be more performant in mongo, so at the moment the reduction
 * is not done.  */
var machetils = require('../lib/machetils');
/*  ^^^^^^^^^ and above is explained why is machetils */
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
	var promiseURLs = _.map(nconf.get('vantages'), function(vp) {
		var url = [ vp.host, 'api', 'v1',
					page.id, 'BP' ].join('/');
		return {
			url: url,
			page: page.href,
			VP: vp.name,
			subjectId: page.id
        }
	});
	return _.concat(memo, promiseURLs);
};

function getPromiseURLs(target) {
    /* note: correctly is returning only the promises requested,
     * in theory we can check VP operating -- remind, before was subject,
     * maybe something need a revision  */
    var reference = new Date( moment().subtract(target.dayswindow, 'd').format("YYYY-MM-DD") );
    var filter = _.extend(target.filter, { start: { "$gt": reference } });

    return mongo
        .read(nconf.get('schema').promises, target.filter)
        .tap(function(p) {
            debug("With filter %j we have %d promises",
                target.filter, _.size(p));
        })
	    .reduce(buildURLs, []);
}

function saveAll(retrieved) {
    return Promise
        .reduce(retrieved, function (memo, subject) {
            debugger;

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

            var target = _.find(subject.data, {target: true})
            if(!target)
                return memo;

            /* this to keep track of the unique third party domains */
            target.unique = {};
            /* this to keep track of total javascriptps present to be analyzed */
            target.javascripts = 0;
            /* this to keep track the domain setting a cookie */
            target.cookies = [];
            /* this to keep track unique companies name */
            target.companies = [];
            /* unrecognized domain */
            target.unrecognized = [];

            _.each(_.reject(subject.data, {target: true}), function(rr) {

                if(_.isUndefined(target.unique[rr.domainId]))
                    _.set(target.unique, rr.domainId, 0);

                target.unique[rr.domainId] += 1;

                if(rr['Content-Type'] && rr['Content-Type'].match('script'))
                    target.javascripts += 1;

                if(rr.company && target.companies.indexOf(rr.company)  === -1 ) {
                    target.companies.push(rr.company);
                } else {
                    target.unrecognized.push(rr.domaindottld)
                }

                if(rr['Server'] === 'cloudflare-nginx') {
                    debug("CF server spot in %s (company %s)!", rr.domaindottld, rr.company);
                    target.companies.push("Cloudflare");
                }

                if(rr.cookies && _.size(rr.cookies)) {
                    target.cookies.push(rr.domaindottld);
                }

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

return getPromiseURLs(target)
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

