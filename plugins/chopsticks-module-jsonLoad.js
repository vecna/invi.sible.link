
var _ = require('lodash'),
    Promise = require('bluebird'),
    debug = require('debug')('plugin.jsonLoad'),
    importer = require('../lib/importer');


module.exports = function(staticInput, datainput) {

    return new Promise.map(datainput.source, function(siteEntry) {
        return {
            debugName: siteEntry._ls_links[0].href,
            phantomFile: siteEntry._ls_dir.location + siteEntry._ls_dir.timeString + '.json',
            logFile : siteEntry._ls_dir.location + 'executions.log'
        };
    })
    .then(function(fileEntries) {
        debug("Here is the possiblilty to filter the %d files (not implemented)",
        _.size(fileEntries));
        return fileEntries;
    })
    .map(importer.importLog)
    .map(importer.importPhantput)
    .then(function(fileEntries) {
        return _.reduce(fileEntries, function(memo, jFE) {
            if ((jFE.fetchInfo == null) || (jFE.rr === []))
                return memo;
            memo.push({
                rr: jFE.rr,
                stats: importer.computeStats(jFE.rr),
                phantomFile: jFE.phantomFile,
                fetchInfo: jFE.fetchInfo
            });
            return memo;
        }, []);
    })
    .then(function(scanData) {
        if (_.size(scanData) === 0) {
            throw new Error("are the files missing ? I found 0 complete logs");
        }
        datainput.data = scanData;
        return datainput;
    });
};

