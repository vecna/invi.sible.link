var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('↻ chopsticks');
var request = Promise.promisifyAll(require('request'));
var nconf = require('nconf');

var plugins = require('../plugins');

var cfgFile = "config/chopsticks.json";

nconf.argv()
     .env()
     .file({ file: cfgFile });

var VP = nconf.get('VP');
if(_.isUndefined(VP)) {
    console.log("VP, vantage point, is needed in the Environment. forced 'dummy'");
    VP = 'dummy';
}

var directionByKind = {
    "basic": {
        "plugins": [ "systemState", "phantom", "saver", "reportBack" ],
        "config": null
    }
};

function keepPromises(N) {
    var direction = directionByKind[N.needName];
    debug("%j ", direction);
    return Promise.reduce(direction.plugins, function(state, p) {
        debug("Call %s about %s state key (%j)", p, state.href, _.keys(state));
        return plugins[p](state, direction.config);
    }, N);
};

var url = nconf.get('source') + '/api/v1/getTasks/' + VP + '/' + nconf.get('amount');
debug("Looking for some needs in %s...", url);
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
    .map(keepPromises, { concurrency: 1})
    .then(function(solutions) {
        debug("TODO, posts the solutions to the promises");
    })
    .catch(function(error) {
        debug("Unamanged error, chopstick breaks");
        debug(error);
    });
