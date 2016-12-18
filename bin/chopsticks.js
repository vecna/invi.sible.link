var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('↻ chopsticks');
var request = Promise.promisifyAll(require('request'));
var nconf = require('nconf');

var plugins = require('../plugins');
var choputils = require('../lib/choputils');

var cfgFile = "config/chopsticks.json";

nconf.argv()
     .env()
     .file({ file: cfgFile });

var VP = nconf.get('VP');
if(_.isUndefined(VP) || _.size(VP) === 0 ) {
    console.log("VP, vantage point not found -- forced 'dummy'");
    VP = 'dummy';
}

var concValue = nconf.get('concurrency') || 1;

var directionByKind = {
    "basic": {
        "plugins": [ "systemState", "phantom", "saver", "confirmation" ],
        "config": null
    }
};

function keepPromises(N, i) {
    var direction = directionByKind[N.needName];
    return Promise
        .reduce(direction.plugins, function(state, p) {
            debug("%d Call %s about %s: state keys #%d",
                i, p, state.href, _.size(_.keys(state)) );
            return plugins[p](state, direction.config);
        }, N)
        .tap(function(product) {
            debug("%d Completed %s: state keys #%d",
                i, N.href, _.size(_.keys(product)) );
        });
};

var url = choputils
            .composeURL(
                choputils.getVP(nconf.get('VP')),
                nconf.get('source'),
                { what: 'getTasks', option: nconf.get('amount') }
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
    .catch(function(error) {
        debug("Unamanged error, chopstick breaks");
        debug(error);
    });
