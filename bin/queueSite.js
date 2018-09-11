#!/usr/bin/env node
var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('bin:queueSite');
var nconf = require('nconf');
var moment = require('moment');

var mongo = require('../lib/mongo');
var various = require('../lib/various');
var promises = require('../lib/promises');
var queue = require('../lib/queue');

nconf.argv().env().file({ file: 'config/vigile.json' });

var url = nconf.get('url');
var testkind = nconf.get('kind');
var description = nconf.get('description') || "";
var campaign = nconf.get('campaign') || "manuallyInserted";

var accepted = [ "basic", "badger", "urlscan" ] ;
if(!url || !testkind) {
    console.log("required variables --url http://url.. --kind ", accepted);
    return 1;
}

if(accepted.indexOf(testkind) === -1) {
    console.log("kind not accepted", testkind, accepted);
    return 1;
}

var now = moment();
var directive = queue.buildDirective(testkind, now, url, campaign, description, 0);

return queue
    .add([ directive ])
    .tap(queue.report)
    .return(directive.id);
