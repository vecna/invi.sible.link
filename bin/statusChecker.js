#!/usr/bin/env nodejs
var Promise = require('bluebird');
var debug = require('debug')('statusChecker');
var nconf = require('nconf');

var mongo = require('../lib/mongo');
var machetils = require('../lib/machetils');

nconf.argv().env();
var cfgFile = nconf.get('config') || "config/statusChecker.json";
nconf.file({ file: cfgFile });

function prepareURLs(srcobj) {
    srcobj.url = srcobj.host + '/api/v1/' + 'system/info';
    return srcobj;
}

var taskName = nconf.get('taskName');
if(!taskName)
	throw new Error("need --taskName or env `taskName`");

debug("Retriving stats from %s",
    JSON.stringify(nconf.get('sources'), undefined, 2) );

return Promise
    .map(nconf.get('sources'), prepareURLs)
    .map(machetils.jsonFetch, {concurrency: 1})
    .then(function(content) {
        return machetils
            .mongoSave(nconf.get('target'), content, taskName);
    })
    .tap(function(r) {
        debug("Operationg compeleted successfully");
    });
