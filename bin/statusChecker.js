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

return Promise
    .map(nconf.get('sources'), prepareURLs)
    .map(machetils.jsonFetch, {concurrency: 4})
    .then(_.compact)
    .then(function(content) {
        return _.map(content, function(c) {
            return _.extend({ name: c.name,
                              task: 'default-stats',
                              when: new Date(),
                              loadavg: c.data.loadavg },
                            c.data.columns,
                            c.data.freespace);
        });
    })
    .then(function(cc) {
        if(_.size(cc)) {
            debug("+ %s", JSON.stringify(cc, undefined, 1));
            return machetils.statsSave(nconf.get('target'), cc);
        } else {
            debug("Network or application error: no data available!");
        }
    })
    .tap(function(r) {
        debug("Operation compeleted!");
    });
