#!/usr/bin/env nodejs
var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('computeResults');
var moment = require('moment');
var nconf = require('nconf');

var sites = require('../lib/sites');
var mongo = require('../lib/mongo');
var various = require('../lib/various');
var machetils = require('../lib/machetils');
var company = require('../lib/company');
var promises = require('../lib/promises');
var google = require('../lib/google');

nconf.argv().env();
var cfgfile = nconf.get('config') || 'config/analyzerProduction.json';
nconf.argv().env().file('config/storyteller.json').file('vantages', cfgfile);
if(!nconf.get('campaign')) { console.log("--campaign is necessary"); return }
var campaign = nconf.get('campaign');

var whenD = nconf.get('DAYSAGO') ? 
    moment()
        .startOf('day')
        .subtract(_.parseInt(nconf.get('DAYSAGO')), 'd')
        .toISOString() :
    moment()
        .startOf('day')
        .toISOString();
debug("This analysis will be saved as made on %s", whenD);

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


function saveAll(retrieved) {
    return Promise
        .reduce(retrieved, function (memo, subject) {

            var target = _.find(subject.data, {target: true});
            if(!target) {
                debug("Missing target among the .data??");
                return memo;
            }

            target.macheteTiming = subject.timing;

            /* these fields are kept in target only ATM, TODO cleaning or remove this 4 lines */
            var fieldstrip = ['disk','phantom' ];
            var inclusions = _.map(_.reject(subject.data, {target: true}), function(rr) {
                return _.omit(rr, fieldstrip);
            });

            return _.concat(memo, target, inclusions);
        }, [])
        .map(function(evidenceO, i) {
            evidenceO.id = various.hash({
                daily: whenD,
                campaign: campaign,
                tested: evidenceO.href,
                i: i
            });
            evidenceO.when = new Date(whenD);
            evidenceO.campaign = campaign;
            return evidenceO;
        })
        .tap(function(content) {
            debug("saveAll (evidences) has %d objects", _.size(content) );

            return Promise
                .map(content, function(e) {
                    return mongo
                        .read(nconf.get('schema').evidences, { id: e.id})
                        .then(_.first)
                        .tap(function(result) {
                            if(_.isUndefined(result))
                                return mongo.writeOne(nconf.get('schema').evidences, e)
                        })
                        .delay(50);
                }, {concurrency: 5})
                .then(_.compact)
                .tap(function(saved) {
                    debug("The elements saved in `evidences` are %d", _.size(saved));
                });
        });
}

function updateResults(retrieved) {

    return Promise
        .reduce(retrieved, function (memo, subject, i, total) {

            var target = _.find(subject.data, {target: true});
            if(!target)
                return memo;

            /* this to keep track of the unique third party domains */
            // target.unique = {};

            /* this to keep track of total javascriptps present to be analyzed */
            target.javascripts = 0;
            /* this to keep track the domain setting a cookie */
            target.cookies = [];
            /* this to keep track unique companies name */
            target.companies = [];
            /* unrecognized domain */
            target.unrecognized = [];
            /* google specific product tracking */
            target.googles = {};

            _.each(_.reject(subject.data, {target: true}), function(rr, cnt) {

                debug(rr.product);
                if(rr.product)
                    if(_.get(target.googles, rr.product))
                        target.googles[rr.product]++;
                    else
                        _.set(target.googles, rr.product, 1);

                if(rr['Content-Type'] && rr['Content-Type'].match('script'))
                    target.javascripts += 1;

                if(rr.company) {
                    if(target.companies.indexOf(rr.company) === -1 ) {
                        target.companies.push(rr.company);
                    }
                }
                else {
                    if(target.unrecognized.indexOf(rr.domaindottld) === -1
                        && rr.domaindottld !== target.domaindottld
                        && !_.startsWith(rr.domaindottld, "data:") ) {
                        target.unrecognized.push(rr.domaindottld);
                    }
                }

                if(rr['Server'] === 'cloudflare-nginx') {
                    // debug("CF server spot in %s (company %s)!", rr.domaindottld, rr.company);
                    target.cloudFlare = true;
                }

                if(rr.cookies && _.size(rr.cookies))
                    target.cookies.push(rr.domaindottld);

                if(rr.post)
                    target.xhr = target.xhr ? target.xhr + 1 : 1;
            });

            return _.concat(memo, target);
        }, [])
        .map(function(resultsO) {
            resultsO.id = various.hash({
                daily: whenD,
                campaign: campaign,
                tested: resultsO.href
            });
            resultsO.when = new Date(whenD);
            resultsO.campaign = campaign;
            return _.pick(resultsO, [ 'href', 'id', 'campaign', 'javascripts', 
                    'requestTime', 'googles', 'cookies', 'companies', 'unrecognized']);
        })
        .tap(function(content) {
            debug("updateSurface has %d objects", _.size(content) );

            return Promise
                .map(content, function(e) {
                    return mongo
                        .read(nconf.get('schema').results, { id: e.id})
                        .then(_.first)
                        .tap(function(result) {
                            if(_.isUndefined(result))
                                return mongo.writeOne(nconf.get('schema').results, e)
                        });
                }, {concurrency: 5})
                .then(_.compact)
                .tap(function(saved) {
                    debug("The elements saved in `results` are %d", _.size(saved));
                });
        });
};

function updateSite(result) {

    return mongo
        .read(nconf.get('schema').sites, { campaign: campaign, href: result.href })
        .then(_.first)
        .then(function(site) {
            site.lastResultId = result.id;
            site.lastCheckTime = result.requestTime;
            debugger;
            return mongo.updateOne(nconf.get('schema').sites, { id: site.id }, site);
        });
};

function mylined(entry, notes) {
    debug("%s elements %d", notes, _.size(entry));
    debug("keys: 
    debugger;
};
var phantom = require('../plugins').phantom;
var phantomSaver = require('../plugins').phantomSaver;

        "plugins": [ "systemState", "phantom", "phantomSaver", "confirmation" ],

    return phantom()
        .then(phantomSaver())
    .map(machetils.jsonFetch, {concurrency: 10})
    .tap(machetils.numerize)
    .then(_.compact)
    .then(onePerSite)
    .tap(machetils.numerize)
    .map(company.attribution)
    .map(company.countries)
    .map(google.valorizeGoogle)
    .tap(machetils.numerize)
    .tap(saveAll)
    .then(updateResults)
    .map(updateSite)
    .tap(machetils.numerize)
    .tap(function(r) {
        debug("Operationg compeleted successfully");
    });




#!/usr/bin/env nodejs
var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('chopsticks');
var request = Promise.promisifyAll(require('request'));
var nconf = require('nconf');
var spawnCommand = require('../lib/cmdspawn');

var choputils = require('../lib/choputils');

var cfgFile = nconf.get('config') || "config/chopsticks.json";

nconf.argv()
     .env()
     .file({ file: cfgFile });

var VP = nconf.get('VP');
if(_.isUndefined(VP) || _.size(VP) === 0 )
    throw new Error("Missing the Vantage Point (VP) in the config file");

var mandatory = nconf.get('mandatory') ? true : false;
var concValue = nconf.get('concurrency') || 1;
concValue = _.parseInt(concValue);

    "basic": {
        "plugins": [ "systemState", "phantom", "phantomSaver", "confirmation" ],
        "config": {
            maxSeconds: 30,
            root: "./phantomtmp",
            VP: VP
        }
    },
    "badger": {
        "plugins": [ "systemState", "badger", "badgerSaver", "confirmation" ],
        "config": {
            maxSeconds: 50,
            root: "./badgertmp",
            VP: VP
        }
    },
    "urlscan": {
        "plugins": [ "systemState", "urlscan", "urlscanSaver", "confirmation" ],
        "config": {
            VP: VP
        }
    },
};

var type = nconf.get('type');
/* validation of the type requested */
if(_.keys(directionByKind).indexOf(type) === -1) {
    console.error("Invalid --type "+type+" expected: "+
        _.keys(directionByKind));
    return -1;
}

        "plugins": [ "systemState", "phantom", "phantomSaver", "confirmation" ],
        "config": {
            maxSeconds: 30,
            root: "./phantomtmp",
            VP: VP


function keepPromises(N, i) {
    /* N is the need, the promise, the object written by lib/queue.js */
    var direction = directionByKind[N.kind];
    return Promise
        .reduce(direction.plugins, function(state, p) {
            debug("%d calling '%s' [%s] (%s): keys #%d",
                i, p, state.href, state.campaign,
                _.size(_.keys(state)) );
            return plugins[p](state, direction.config);
        }, N)
        .tap(function(product) {
            debug("#%d/%d Completed %s: state keys #%d",
                i, concValue, N.href, _.size(_.keys(product)) );
        });
};

var url = choputils
            .composeURL(
                choputils.getVP(nconf.get('VP')),
                nconf.get('source'),
                {
                    what: mandatory ? 'getMandatory' : 'getTasks',
                    type: type,
                    param: nconf.get('amount')
                }
            );

debug("Starting with concurrency %d", concValue);
return request
    .getAsync(url)
    .then(function(response) {
        return JSON.parse(response.body);
    })
    .then(function(needs) {
        debug("Received %d needs", _.size(needs));
        /* estimation of load might define concurrency and delay */
        return needs;
    })
    .map(keepPromises, { concurrency: concValue })
    .then(function(results) {
        var e = _.filter(results, { saveError: true});
        if(_.size(e))
          debug("Note: %d website failed on %d", _.size(e), _.size(results));

        return Promise.all([
            spawnCommand({ binary: "/usr/bin/killall", args: [ "Xvfb" ] }),
            spawnCommand({ binary: "/usr/bin/killall", args: [ "chromedriver" ] }),
            spawnCommand({ binary: "/usr/bin/killall", args: [ "phantomjs" ] })
        ]);
    });
