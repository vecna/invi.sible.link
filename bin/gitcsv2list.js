#!/usr/bin/env nodejs
var _ = require('lodash');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var debug = require('debug')('anyTREX»gitcsv2json');
var nconf = require('nconf').env();

var csvFile = nconf.get('src');
var destFile = nconf.get('dest');

if(!csvFile || !destFile)
    throw new Error("Missing `src` or `dest`");

return fs
    .readFileAsync(csvFile, 'utf-8')
    .then(function(csvc) {
        var lines = csvc.split('\r\n');
        debug("%d lines → keys [%s] 'rank' will be add",
            _.size(lines)-1, lines[0] );

        return _.reduce(_.tail(lines), function(memo, entry, i) {
            var comma = entry.indexOf(',');

            if(comma === -1 || _.size(entry.substring(0, comma)) === 0)
                return memo;

            memo.push({
                'href': entry.substring(0, comma),
                'description': _.trim(entry.substring(comma+1), '"'),
                'rank': i + 1
            });
            return memo;
        }, []);
    })
    .then(function(content) {
    debug("Writin %s (JSON) with %d entries", destFile, _.size(content));
    return fs
        .writeFileAsync(destFile, JSON.stringify(content, undefined, 2));
    });
