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

var MISSING_NATION = 'UNKNOW';

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

function sankeys(surface) {

  debug("Generating sankeys");

  return various
    .loadJSONfile("fixtures/companyCountries.json")
    .then(function(companyMap) {

        debugger;
        var nodes = _.reduce(surface, function(memo, e) {
            
            if(!_.size(e.companies)) {
                debug("Site %s has not trackers!", e.href);
                return memo;
            }

            memo.push({
                "href": e.href,
                "name": e.href.replace(/https?:\/\//, ''),
                "group": "site",
                "node": _.size(memo)
            });

            _.each(e.companies, function(comp) {
                if(!_.find(memo, {"name": comp, "group": "company" })) {
                    memo.push({
                        "name": comp,
                        "group": "company",
                        "node": _.size(memo)
                    });

                    var nation = companyMap[comp];
                    if(!_.isString(nation)) {
                        nation = "MISSING_NATION";
                        companyMap[comp] = nation;
                    }

                    if(!_.find(memo, {"name": nation, "group": "country"})) {
                        memo.push({
                            "name": nation,
                            "group": "country",
                            "node": _.size(memo)
                        });
                    }
                }
            });
            return memo;
        }, []);

        var missing = _.reduce(surface, function(memo, e) {
            _.each(e.companies, function(comp) {
                if(companyMap[comp] == 'MISSING_NATION') {
                    memo.hack[comp] = "";
                    memo.help[comp] = "<a href='https://duckduckgo.com/" +
                                         _.replace(comp, /\ /g, '%20') +
                                      "'>" +
                                      comp +
                                      "</a>";
                }
            });
            return memo;
        }, { hack: {}, help: {} });

        debug("For missing companies: %s %s",
            JSON.stringify(missing.hack, undefined, 2),
            JSON.stringify(missing.help, undefined, 2));

        var companySize = {};
        var links = [];

        _.each(_.filter(nodes, {"group": "site" }), function(sentry) {
            var e = _.find(surface, {'href': sentry.href });

            _.each(_.uniq(e.companies), function(cname) {
                var t = _.find(nodes, {"group": "company", "name": cname});

                if(!companySize[cname])
                    companySize[cname] = 0;
                companySize[cname] += 1;

                links.push({
                    'source': sentry.node,
                    'target': t.node,
                    'value': 1
                });
            });
        });

        _.each(companySize, function(size, cname) {
            var t = _.find(nodes,{group:"company",name:cname});
            var n = _.find(nodes,{group:"country",name:companyMap[cname] });
            links.push({source: t.node, target: n.node, value: size });
        });

        debug("sankeys: %d nodes, %d links", _.size(nodes), _.size(links));
        return { nodes: nodes, links: links };
    })
    .then(function(sanflows) {
        return mongo.writeOne(nconf.get('schema').sankeys, {
            when: new Date(),
            campaign: campConf.name,
            nodes: sanflows.nodes,
            links: sanflows.links
        });
    });
};

return getPromiseURLs(campConf)
    .tap(numerize)
    .map(machetils.jsonFetch, {concurrency: 5})
    .tap(numerize)
    .then(_.compact)
    .tap(numerize)
    .map(company.attribution)
    .tap(saveAll)
    .then(updateSurface)
    .then(sankeys)
    .tap(function(r) {
        debug("Operationg compeleted successfully");
    });
