#!/usr/bin/env nodejs
var _ = require('lodash');
var Promise = require('bluebird');
var util = require('util');
var request = Promise.promisifyAll(require('request'));
var debug = require('debug')('machete');
var process = require('process');
var moment = require('moment');
var nconf = require('nconf');

var mongo = require('../lib/mongo');
var various = require('../lib/various');
var machetils = require('../lib/machetils');
var plugins = require('../plugins/machete');

var cfgFile = "config/machete.json";
nconf.argv().env().file({ file: cfgFile });

var task = nconf.get('task');
if(_.isUndefined(task))
    throw new Error("You cant forget $task");

var logic = _.find(nconf.get('tasks'), { name: task });
debug("Based on task requested %s, sequence of commands is %s",
    task, JSON.stringify(logic, undefined, 2));

function infoObj(nome) {
    return {
        'name': nome,
        'when': new Date()
          /* other info if needed */
    };
};

/*  Sequence for every task: 
    Having the 'logic' as starting value, we've a pipeline doing:

    pickFromCore: functionName tool from plugins
    sources: list of server to apply the 'fetch'
    fetch: "system/info" → section of api: http://$source/api/v1/%s
    singleProcess: function to process the output of the `fetch`
    collectiveProcess: function to process all the status
    save: "statistics" → database where thing goes
  */

return machetils.initialize(logic)
    .tap(machetils.D)
    .then(function(val) {
        return Promise.map(val.sources, function(s) {
            debugger;
            return machetils.fetchFrom(s, val)
                .tap(machetils.D)
                .then(machetils.singleProcess)
        }, {concurrency: 1})
    })
    .tap(machetils.D)
    .then(machetils.compactList)
    .tap(machetils.D)
    .then(machetils.collectiveProcess)
    .tap(machetils.D)
    .then(mongoSave);

    /*
debug("Starting with concurrency %d", concValue);
return request
    .getAsync(url)
    .then(function(response) {
        return JSON.parse(response.body);
    })
    .then(function(content) {
        return {
            'data': content,
            'info': [ infoObj("singleFetch") ],
            'logic': task
        };
    })
    .then(function(val) {
        debug("Received %d needs", _.size(needs));
        return needs;
    })
    .map(keepPromises, { concurrency: concValue })
    .catch(function(error) {
        debug("Unamanged error, chopstick breaks");
        debug(error);
    });
  */
