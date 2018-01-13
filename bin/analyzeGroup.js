#!/usr/bin/env nodejs
var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('bin:analyzeGroup');

var moment = require('moment');
var nconf = require('nconf');

var mongo = require('../lib/mongo');
var various = require('../lib/various');
var promises = require('../lib/promises');
var machetils = require('../lib/machetils');

nconf.argv().env();
var tname = promises.manageOptions();
nconf.argv().env().file({'file': 'config/storyteller.json' });
var daysago = nconf.get('daysago') ? _.parseInt(nconf.get('daysago')) : 0;
var remote = nconf.get('remote') ? nconf.get('remote') : 'https://invi.sible.link';
var MAX = nconf.get('MAX') ? _.parseInt(nconf.get('MAX')) : 10;

var remote = 'https://invi.sible.link';
if(!nconf.get('remote'))
    debug("Using default remote endpoint: %s", remote);
else
    remote = nconf.get('remote');

var m = moment().startOf('day').add(10, 'h');
if(_.parseInt(nconf.get('daysago')))
    m.subtract(_.parseInt(nconf.get('daysago')), 'd');
var whenD = new Date(m.format());

/* code begin here */
function saveAll(content) {
    debug("Saving in results the product in 'judgment' table");
    return machetils.statsSave(nconf.get('schema').judgment, [ content ]);
}

function removeExisting(content) {
    return mongo
        .remove(nconf.get('schema').judgment, { when: content.when, campaign: content.campaign });
}

function getEvidenceAndDetails(daysago, target) {

    debug("Using endpoing %s", remote);
    var url = remote + "/api/v1/mixed/" + target + "/" + daysago;
    /* it returns [ surface ],[details] */
    return various
        .loadJSONurl(url)
        .tap(function(m) {
            if( !_.size(m[0]) || !_.size(m[1]) ) {
                debug("Failure in retrieve %s %d days ago, surface %d details %d",
                    target, daysago, _.size(m[0]), _.size(m[1]));
                process.exit(0);
            }
            debug("Processing %d 'surface' and %d 'details'",
                _.size(m[0]), _.size(m[1]));
        });
};

function campaignStats(m) {
    var surfaces = _.uniqBy(m[0], 'url');

    /* necessary fields: total, trackers, unrecognized */
    var ret = {
        total: _.size(surfaces)
    };

    ret.trackers = _.size(_.flatten(_.map(surfaces, 'companies')));
    ret.unrecognized = _.size(_.flatten(_.map(surfaces, 'unrecognized')));
    ret.includedJS = _.size(_.flatten(_.map(surfaces, 'javascripts')));
    ret.cookies = _.size(_.flatten(_.map(surfaces, 'cookies')));

    return ret;
};

function rankTheWorst(m) {
    /* this is supposed to be subjectId, I deployed testId in these days to 
     * make it sure is different, and subjectId is based on url+day */
    var surfaces = _.uniqBy(m[0], 'url');
    if(_.size(surfaces) !== _.size(m[0]))
        debug("Just remind, for some undebugged reason, /api/v1/mixed is returning duplicated 'surfaces'");
    /* the current concept of "worst" is pretty experimental, there
     * is not a scientifical measurement on which network behavior
     * causes the bigger damage to privacy/security, but this is 
     * a metric in which research and investigations can provide 
     * input. The output object is:
     *  - name (the url)
     *  - totalNjs (total number of js)
     *  - post (if XMLHttpRequest has triggered some POST)
     *  - canvas
     *  - reply session
     *  - storage (indexDB or localStorage) usage
     *  - companies number
     *  - total "score" still to be done well
     * */

    /* this function just aggregate the results obtain from
     * different analysis (surface+details), now we can get 
     * an object with merged the results
     */
    var aggregated = _.map(surfaces, function(surface) {
        var url = surface.url;
        var details = _.find(m[1], { href: url });

        var ret = {
            name: surface.url,
            description: surface.description, // XXX is not really provided, it is left in the promise
            subjectId: surface.subjectId,
            totalNjs: surface.javascripts,
            companies: _.size(surface.companies),
            storage: null,
            reply: null,
            canvas: null,
            post: surface.xhr,
            cookies: _.size(surface.cookies)
        };

        /* look into details, and find 'storage', 'canvas' etc */
        _.each(details, function(n, d) {
            // console.log(n, d);
        });

        ret.measure = (ret.companies + ret.cookies + ret.totalNjs);
        return ret;
    });

    return _.slice(_.reverse(_.sortBy(aggregated, 'measure')), 0, MAX);
};

return getEvidenceAndDetails(daysago, tname)
    .then(function(mixed) {
        return [ rankTheWorst(mixed), campaignStats(mixed) ]
    })
    .then(function(mixedr) {
        debug("%s Stats: %j, Worst %d:", tname, mixedr[1], MAX);
        _.each(mixedr[0], function(e, i) {
            debug("%d\t[%d] %s", i+1, e.measure, e.name);
        });
        return _.extend(mixedr[1], {
            when: whenD,
            campaign: tname,
            ranks: mixedr[0],
        });
    })
    .tap(removeExisting)
    .tap(saveAll);
