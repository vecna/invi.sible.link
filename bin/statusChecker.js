#!/usr/bin/env nodejs
var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('statusChecker');
var nconf = require('nconf');

var mongo = require('../lib/mongo');
var machetils = require('../lib/machetils');

nconf.argv().env();
var cfgFile = nconf.get('config') || "config/statusChecker.json";
nconf.file({ file: cfgFile });

function prepareURLs(srcobj) {
    srcobj.url = [ srcobj.host, 'api', 'v1', 'system', 'info' ].join('/');
    return srcobj;
}

var taskName = nconf.get('taskName');
if(!taskName)
	throw new Error("need --taskName or env `taskName`");

return Promise
    .map(nconf.get('sources'), prepareURLs)
    .map(machetils.jsonFetch, {concurrency: 4})
    .then(_.compact)
    .then(function(content) {
        return _.map(content, function(c) {
            return _.extend({name:
                c.name
            }, c.data.columns, c.data.freespace);
        });
    })
    .then(function(cc) {
        debug("Saving %j", cc);
        return machetils.mongoSave(nconf.get('target'), cc, taskName);
    })
    .tap(function(r) {
        debug("Operation compeleted!");
    });
