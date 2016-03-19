
var _ = require('lodash'),
    Promise = require('bluebird'),
    debug = require('debug')('plugin.ini'),
    moment = require('moment'),
    fs = require('fs'),
    importer = require('../lib/importer'),
    linkIdHash = require('../lib/transformer').linkIdHash,
    domainTLDinfo = require('../lib/domain').domainTLDinfo,
    directoryStruct = require('../lib/jsonfiles').directoryStruct;

Promise.promisifyAll(fs);

module.exports = function(staticInput, datainput) {

    /* TODO copia da old_init_backup, rimpiazza la lista usando quella degli ini, i valori di
     rank sono quelli presenti in tutto lo staticInput-. in pratica è intercambiabile con source */

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
    'ini.name': {
        nargs: 1,
        type: 'string',
        default: null,
        desc: 'name of the target to be loaded'
    },
    'ini.date': {
        nargs: 1,
        type: 'string',
        default: null,
        desc: 'Specify the date used as sub directory of .target'
    },
    'ini.day': {
        nargs: 1,
        default: 0,
        desc: '(relative) day in the past to generate sub directory'
    },
    'ini.slots': {
        nargs: 1,
        type: 'string',
        default: "1,0,1",
        desc: 'selection '
    }
};

