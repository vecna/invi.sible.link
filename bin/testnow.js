#!/usr/bin/env nodejs
var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('testnow');
var nconf = require('nconf');
var moment = require('moment');

var mongo = require('../lib/mongo');
var various = require('../lib/various');
var promises = require('../lib/promises');

nconf.argv().env().file({ file: 'config/vigile.json' });

var target = nconf.get('target');
var testkind = nconf.get('type');
var description = nconf.get('description') || "";

var accepted = [ "basic", "badger", "urlscan" ] ;
if(!target || !testkind) {
    console.log("required variables target (url) and type:", accepted);
    return 1;
}

if(accepted.indexOf(testkind) === -1) {
    console.log("type not accepted", testkind, accepted);
    return 1;
}

var now = moment().startOf('day');
var directive = {
    needName: testkind,
    start: new Date(now.format("YYYY-MM-DD")),
    id: various.hash({
        'href': target,
        'unique': _.random(1, 0xffffff)
    }),
    href: target,
    description: description,
    rank: 0,
    subjectId: various.hash({
        'manuallyInserted': now.format("YYYY-MM-DD")
    })
};

debug("Writing %s", JSON.stringify(directive, undefined, 2));
return mongo.writeOne(nconf.get('schema').promises, directive);
