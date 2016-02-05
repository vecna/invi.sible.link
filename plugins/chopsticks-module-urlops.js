
var _ = require('lodash'),
    Promise = require('bluebird'),
    debug = require('debug')('plugin.urlops'),
    moment = require('moment'),
    fs = require('fs'),
    linkIdHash = require('../lib/transformer').linkIdHash,
    domainTLDinfo = require('../lib/domain').domainTLDinfo,
    directoryStruct = require('../lib/jsonfiles').directoryStruct;

Promise.promisifyAll(fs);

module.exports = function(datainput) {

    var siteList = datainput.source,
        retVal = [];

    return Promise.map(siteList, function(siteEntry) {

        var i = _.merge(
                linkIdHash(siteEntry)._ls_links,
                domainTLDinfo(siteEntry._ls_links)
            ),
            d = directoryStruct(i, process.env.FETCHER_TARGET);

            return fs
                .statAsync(d.location)
                .then(function(presence) {
                    debug("%s exists: ignored re-execution", d.location);
                })
                .catch(function(error) {
                    debug("%s do not exists: will be fetch", d.location);
                    siteEntry._ls_links = i;
                    siteEntry._ls_dir = d;
                    retVal.push(siteEntry);
                });

    }).return(retVal);
};

