#!/usr/bin/env nodejs
var _ = require('lodash');
var Promise = require('bluebird');
var util = require('util');
var request = Promise.promisifyAll(require('request'));
var fs = Promise.promisifyAll(require('fs'));
var debug = require('debug')('socialmediapull');
var nconf = require('nconf');
var process = require('process');
var moment = require('moment');

var mongo = require('../lib/mongo');
var various = require('../lib/various');
var promises = require('../lib/promises');
var queue = require('../lib/queue');

nconf.argv().env().file({ file: 'config/socialmedia.json' });

var remote = nconf.get('remote');
var testkind = nconf.get('kind');
var campaign = nconf.get('campaign') || "socialmedia";
var now = moment();
var endpoint = nconf.get('endpoint');
var url = remote + endpoint;
var accepted = [ "basic", "badger", "urlscan" ] ;

nconf.argv().env().file({ file: 'config/vigile.json' });

if(!testkind) {
    console.log("required variables --url http://url.. --kind ", accepted);
    return 1;
}

if(accepted.indexOf(testkind) === -1) {
    console.log("kind not accepted", testkind, accepted);
    return 1;
}

return various
    .loadJSONurl(url)
    .then(function(full) {
        return full.results;
    })
    .tap(function(c) {
        debug("Retrieved %d urls from %s", _.size(c), url);
    })
    .map(function(block) {
        return queue.buildDirective(testkind, now, block.link, campaign, block.permaLink, 0);
    })
    .then(queue.add)
    .tap(queue.report);
