
var _ = require('lodash'),
    Promise = require('bluebird'),
    debug = require('debug')('plugin.source'),
    moment = require('moment'),
    fs = require('fs'),
    importer = require('../lib/importer'),
    linkIdHash = require('../lib/transformer').linkIdHash,
    domainTLDinfo = require('../lib/domain').domainTLDinfo,
    directoryStruct = require('../lib/jsonfiles').directoryStruct;

Promise.promisifyAll(fs);

/* create the .source based on a specific list of country or categories,
 * default: all of them */

module.exports = function(staticInput, datainput) {

    debug("Starting from %d Site entries before source selection",
        _.size(staticInput.world) );

    /* hardcoded: only the websites with rank =< 100 are kept now,
     *  and the slots is consider OFC, slots are considered always after a sort by hash */

    datainput.source = _.reduce(staticInput.world, function(memo, siteEntry) {

        if(_.lt(process.env.SOURCE_RANK,  _.min(siteEntry.categories, function(rank) {
            return rank.rank;
        }).rank))
            return memo;
        if(_.lt(process.env.SOURCE_RANK,  _.min(siteEntry.countries, function(rank) {
            return rank.rank;
        }).rank))
            return memo;

        memo.push({
            when: moment().format('YYMMDD'),
            input_hash: siteEntry.input_hash,
            _ls_links: [{
                href: 'http://' + siteEntry.href,
                type: 'target'
            }]
        });
        return memo;
    }, []);

    debug("Filtered source contains now %d sites", _.size(datainput.source) );
    return datainput;
};

module.exports.argv = {
    'source+categ': {
        nargs: 1,
        type: 'string',
        default: null,
        desc: 'specifiy one (or more) category you want keep'
    },
    'source-categ': {
        nargs: 1,
        type: 'string',
        default: null,
        desc: 'Specify one (or more) category to exclude'
    },
    'source+country': {
        nargs: 1,
        type: 'string',
        default: null,
        desc: 'specifiy one (or more) two letter code to exclude'
    },
    'source-country': {
        nargs: 1,
        type: 'string',
        default: null,
        desc: 'Specify one or more two letter code to exclude'
    },
    'source.rank': {
        nargs: 1,
        default: 200,
        desc: 'strip sites ranked less than'
    },
    'source.slots': {
        nargs: 1,
        type: 'string',
        default: '1,0,1',
        desc: 'Slot segment of the source'
    }
};

