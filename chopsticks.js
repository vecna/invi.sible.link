var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('↻ chopsticks');
var request = Promise.promisifyAll(require('request'));
var plugins = require('./plugins');
var nconf = require('nconf');

var cfgFile = "config/chopsticks.json";

nconf.argv()
     .env()
     .file({ file: cfgFile });

var url = nconf.get('source') + '/api/v1/getTasks/' + nconf.get('vp');
debug("Looking for some needs in %s...", url);
return request
    .getAsync({
        url: url
    })
    .then(function(needs) {
        debug("Received %d needs, can be filtered/reduced in size",
            _.size(needs));
        return needs;
    })
    .then(function(needs) {
        debug("Iterating over the needs:");
        console.log(JSON.stringify(needs, undefined, 2));
        return Promise.reduce(needs.chain, function(memo, p) {
            debug("Executing %s", p.plugin);
            var state = plugins[p.plugin](memo, p.config);
            debug("Execution completed from %s", p.plugin);
            return state;
        }, [ needs.promises ]);
    })
    .then(function(solutions) {
        debug("TODO, posts the solutions to the promises");
    })
    .catch(function(error) {
        debug("Unamanged error, chopstick breaks");
        debug(error);
    });
