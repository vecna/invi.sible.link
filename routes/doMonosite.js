#!/usr/bin/env node
var _ = require('lodash');
var debug = require('debug')('route:doMonosite');
var nconf = require('nconf');
var moment = require('moment');

var monoSite = require('../lib/monoSite');

function doMonosite(req) {
    var site = req.params.site;
    var url = 'http://' + site;

    nconf.set('url', url);
    debug("of %s (%s)", nconf.get('url'), nconf.get('campaign'));
    return monoSite.monoSite()
        .then(function(result) {
            return { json: {
                result: _.omit(result, ['data']),
                static: "/site/" + site
            }};
        });
};
                                    
module.exports = doMonosite;
