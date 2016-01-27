var _ = require('lodash'),
    Promise = require('bluebird'),
    debug = require('debug')('plugin.urlops'),
    moment = require('moment'),
    linkIdHash = require('../lib/transformer').linkIdHash;

/* This module:
    - create hash for the URL,
    - extract domain name from full URL page
 */
module.exports = function(datainput) {

    debug("Input: %j", datainput);

    var sources = datainput.profile,
        fetchPromises = [];

    debug("sources %j ", sources);
    var retVal = {};

    _.each(sources, function(siteList, key_order) {

        retVal[key_order] = [];

        _.each(siteList, function(siteEntry) {
            var x = linkIdHash(siteEntry);
            retVal[key_order].push(linkIdHash(siteEntry));
        });
    });

    debug("Done!! returining");
    console.log(JSON.stringify(retVal, undefined, 2));
    return retVal;
};


module.exports.argv = {
    'fetcher.target': {
        nargs: 1,
        type: 'string',
        default: 'tempdump',
        desc: 'Save URL directories into this directory.'
    },
    'fetcher.maxtime': {
        nargs: 1,
        default: 10,
        desc: 'Max amount of seconds which a web fetcher can run'
    },
    'fetcher.concurrency': {
        nargs: 1,
        default: 3,
        desc: 'Concurrency in fetcher executions'
    }
};