
var _ = require('lodash'),
    Promise = require('bluebird'),
    debug = require('debug')('plugin.fromList'),
    moment = require('moment'),
    fs = require('fs'),
    importer = require('../lib/importer'),
    linkIdHash = require('../lib/transformer').linkIdHash,
    domainTLDinfo = require('../lib/domain').domainTLDinfo,
    directoryStruct = require('../lib/jsonfiles').directoryStruct;

Promise.promisifyAll(fs);

module.exports = function(datainput) {

    if(_.size(datainput.source) === 0) {
        throw new Error("Error in the import process, lacking of sources URL");
    }
    debug("Processing %d URL entries and checking disk locations/logs",
        _.size(datainput.source) );

    return Promise
        .map(datainput.source, function(siteEntry) {
            var linkSection = _.merge(
                    linkIdHash(siteEntry)._ls_links,
                    domainTLDinfo(siteEntry._ls_links)
                );
            siteEntry._ls_links = linkSection;
            siteEntry._ls_dir = directoryStruct(linkSection, process.env.FROMLIST_TARGET);
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
    'fromList.target': {
        nargs: 1,
        type: 'string',
        default: 'tempdump',
        desc: 'directory for idempotent functions.'
    },
    'fromList.date': {
        nargs: 1,
        type: 'string',
        default: null,
        desc: 'Specify the date used as subdir'
    },
    'fromList.day': {
        nargs: 1,
        type: 'string',
        default: "0",
        desc: '(relative) day in the past to fetch the data.'
    },
    'fromList.siteselector': {
        nargs: 1,
        type: 'string',
        default: "",
        desc: 'Filter string for file (e.g. "vice".)'
    }
};

