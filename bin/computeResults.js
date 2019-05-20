#!/usr/bin/env node
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
        .format("YYYY-MM-DD") :
    moment()
        .startOf('day')
        .format("YYYY-MM-DD");
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
            return mongo.updateOne(nconf.get('schema').sites, { id: site.id }, site);
        });
};

return mongo
    .read(nconf.get('schema').sites, {campaign: campaign})
    .tap(machetils.numerize)
    .reduce(sites.frequencyExpired, [])
    .tap(machetils.numerize)
    .map(function(site) {
        return mongo
            .readLimit(nconf.get('schema').promises, { href: site.href }, {}, 1, 0);
    }, {concurrency: 1})
    .then(_.flatten)
    .tap(machetils.numerize)
    .reduce(_.partial(promises.buildURLs, 'basic'), [])
    .tap(machetils.numerize)
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
