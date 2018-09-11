#!/usr/bin/env node
var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('chopsticks');
var request = Promise.promisifyAll(require('request'));
var nconf = require('nconf');
var moment = require('moment');
var spawnCommand = require('../lib/cmdspawn');

var plugins = require('../plugins');
var choputils = require('../lib/choputils');
var various = require('../lib/various');

var cfgFile = nconf.get('config') || "config/chopsticks.json";

nconf.argv()
     .env()
     .file({ file: cfgFile });

var VP = nconf.get('VP');
if(_.isUndefined(VP) || _.size(VP) === 0 )
    throw new Error("Missing the Vantage Point (VP) in the config file");

var mandatory = nconf.get('mandatory') ? true : false;
var concValue = nconf.get('concurrency') || 1;
var cfgtimeout = nconf.get('timeout') ? _.parseInt(nconf.get('timeout')) : null;

concValue = _.parseInt(concValue);

var directionByKind = {
    "basic": {
        "plugins": [ "systemState", "phantom", "phantomSaver", "confirmation" ],
        "config": {
            maxSeconds: cfgtimeout ? cfgtimeout : 30,
            root: "./phantomtmp",
            VP: VP
        }
    },
    "badger": {
        "plugins": [ "systemState", "badger", "badgerSaver", "confirmation" ],
        "config": {
            maxSeconds: cfgtimeout ? cfgtimeout : 50,
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

function composeUrl() {

    if(nconf.get('site')) {

        var id = various.hash({
            'href': nconf.get('site'),
            'needName': 'basic',
            'campaign': 'manuallyInserted',
            'start': moment().startOf('day').format("YYYY-MM-DD")
        });
        var rurl = choputils.composeURL(
            choputils.getVP(nconf.get('VP')),
            nconf.get('source'), {
                what: 'getId',
                type: type,
                param: id
            }
        );
        debug("composeURL, forced ID request: %s", rurl);
        return rurl;
    }

    return choputils.composeURL(
        choputils.getVP(nconf.get('VP')),
        nconf.get('source'), {
            what: mandatory ? 'getMandatory' : 'getTasks',
            type: type,
            param: nconf.get('amount')
        }
    );
}

debug("Starting with concurrency %d", concValue);
return request
    .getAsync(composeUrl())
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
