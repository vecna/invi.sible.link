
var _ = require('lodash'),
    Promise = require('bluebird'),
    debug = require('debug')('plugin.diskCheck'),
    moment = require('moment'),
    linkIdHash = require('../lib/transformer').linkIdHash,
    domainTLDinfo = require('../lib/domain').domainTLDinfo,
    directoryStruct = require('../lib/jsonfiles').directoryStruct;

module.exports = function(staticInput, datainput) {

    debug("Processing %d URL entries and checking disk locations/logs",
        _.size(datainput.source) );

    return Promise
        .map(datainput.source, function(siteEntry) {
            var linkSection = _.merge(
                    linkIdHash(siteEntry)._ls_links,
                    domainTLDinfo(siteEntry._ls_links)
                );
            siteEntry._ls_links = linkSection;
            siteEntry._ls_dir = directoryStruct(linkSection, staticInput.config.diskTarget);
            siteEntry.logFile = siteEntry._ls_dir.location + 'executions.log'
            return siteEntry;
        })
        .map(function(siteEntry) {
            return fs
                .statAsync(siteEntry.logFile)
                .then(function(presence) {
                    siteEntry.is_present = true;
                })
                .catch(function(error) {
                    siteEntry.is_present = false;
                })
                .return(siteEntry);
        })
        .then(function(newData) {
            datainput.source = newData;
            return datainput;
        });
};

module.exports.argv = {
    'diskCheck.date': {
        nargs: 1,
        type: 'string',
        default: null,
        desc: 'Specify the date used as sub directory of .target'
    },
    'diskCheck.day': {
        nargs: 1,
        default: 0,
        desc: '(relative) day in the past to generate sub directory'
    }
};

