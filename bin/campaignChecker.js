#!/usr/bin/env nodejs
var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('campaignChecker');

var moment = require('moment');
var nconf = require('nconf');
var mongo = require('../lib/mongo');

var various = require('../lib/various');
var machetils = require('../lib/machetils');
var company = require('../lib/company');

nconf.argv().env();

var cfgFile = nconf.get('config') 
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
            debug("Promises %j %d results (~ %d per day)",
                target.filter, _.size(p), _.round(_.size(p) / target.dayswindow, 2) );
        })
	    .reduce(buildURLs, []);
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
        .map(function(evidenceO, i) {
            var timeString = moment().format("YYYY-MM-DD");
            evidenceO.id = various.hash({
                daily: timeString,
                campaign: campConf.name,
                tested: evidenceO.href,
                i: i
            });
            return evidenceO;
        })
        .then(function(content) {
            debug("saving in evidences %d object", _.size(content));

            if(_.size(content))
                return machetils
                    .mongoSave(nconf.get('evidences'), content, campConf.name);
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

            _.each(_.reject(subject.data, {target: true}), function(rr, cnt) {

                if(_.isUndefined(target.unique[rr.domainId]))
                    _.set(target.unique, rr.domainId, 0);

                target.unique[rr.domainId] += 1;

                if(rr['Content-Type'] && rr['Content-Type'].match('script'))
                    target.javascripts += 1;

                if(rr.company) {
                    if(target.companies.indexOf(rr.company) === -1 ) {
                        target.companies.push(rr.company);
                    }
                }
                else {
                    if(target.unrecognized.indexOf(rr.domaindottld) === -1) {
                        target.unrecognized.push(rr.domaindottld);
                    }
                }

                if(rr['Server'] === 'cloudflare-nginx') {
                    // debug("CF server spot in %s (company %s)!", rr.domaindottld, rr.company);
                    target.cloudFlare = true;
                }

                if(rr.cookies && _.size(rr.cookies)) {
                    target.cookies.push(rr.domaindottld);
                }

            });

            return _.concat(memo, target);
        }, [])
        .map(function(surfaceO) {
            var timeString = moment().format("YYYY-MM-DD");
            surfaceO.id = various.hash({
                daily: timeString,
                campaign: campConf.name,
                tested: surfaceO.href
            });
            return surfaceO;
        })
        .tap(function(content) {
            debug("updateSurface has %d objects (~subjects)", _.size(content) );

            if(_.size(content)) {
                return machetils
                    .mongoSave(nconf.get('surface'), content, campConf.name);
            }
        });
};

function numerize(list) {
    debug("The list in this step has %d elements", _.size(list));
}

return getPromiseURLs(campConf)
    .tap(numerize)
    .map(machetils.jsonFetch, {concurrency: 5})
    .tap(numerize)
    .then(_.compact)
    .tap(numerize)
    .map(company.attribution)
    .tap(saveAll)
    .then(updateSurface)
    // summary ?
    .tap(function(r) {
        debug("Operationg compeleted successfully");
    });

