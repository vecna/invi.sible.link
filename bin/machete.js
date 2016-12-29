#!/usr/bin/env nodejs
var _ = require('lodash');
var Promise = require('bluebird');
var util = require('util');
var request = Promise.promisifyAll(require('request'));
var debug = require('debug')('machete');
var process = require('process');
var moment = require('moment');

var nconf = require('nconf');
var cfgFile = "config/machete.json";
nconf.argv().env().file({ file: cfgFile });

var mongo = require('../lib/mongo');
var various = require('../lib/various');
var plugins = require('../plugins/machete');


var url = choputils
            .composeURL(
                choputils.getVP(nconf.get('VP')),
                nconf.get('source'),
                { what: 'getTasks', param: nconf.get('amount') }
            );

debug("Loaded plugins: %j", plugins);

var task = ncong.get('task');

var logic = _.find(nconf.get('tasks'), { name: task });
debug("Based on task requested %s, logic is %O", task, logic);

/*  Sequence for every task: 
    Having the 'logic' as starting value, we've a pipeline doing:

    pickFromCore: functionName tool from plugins
    sources: list of server to apply the 'fetch'
    fetch: "system/info" → section of api: http://$source/api/v1/%s
    singleProcess: function to process the output of the `fetch`
    collectiveProcess: function to process all the status
    save: "statistics" → database where thing goes
  */


return Promise
    .resolve(
        return pickFromCore(logic.chain.pickFromCore, logic)
    )
    .then(function(content) {
        return Promise
            .map(logic.chain.sources, singleFetch)
            .then(function(results) {
                _.map(logic.chain.sources,
            };

    })
    .then(function(content) {
    })
    .then(function(content) {
    })
    .then(function(content) {
    })
    .then(function(content) {
    });


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

