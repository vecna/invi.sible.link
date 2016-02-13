
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
        newData = [];

    /*
    TODO removing companies website from the target list,
    TODO think pararellization and distribution of large amount of URLs
     */
    debug("processing %d URL entries", _.size(siteList) );
    return Promise.map(siteList, function(siteEntry) {

        var i = _.merge(
                linkIdHash(siteEntry)._ls_links,
                domainTLDinfo(siteEntry._ls_links)
            ),
            d = directoryStruct(i, process.env.URLOPS_TARGET);

            return fs
                .statAsync(d.location)
                .then(function(presence) {
                    siteEntry.is_present = true;
                    siteEntry._ls_links = i;
                    siteEntry._ls_dir = d;
                    newData.push(siteEntry);
                })
                .catch(function(error) {
                    siteEntry.is_present = false;
                    siteEntry._ls_links = i;
                    siteEntry._ls_dir = d;
                    newData.push(siteEntry);
                });

    }).then(function(_null) {
        //console.log(JSON.stringify(newData, undefined, 2));
        datainput.source = newData;
        return datainput;
    });
};

module.exports.argv = {
  'urlops.target': {
    nargs: 1,
    type: 'string',
    default: 'tempdump',
    desc: 'directory for idempotent functions.'
  },
  'urlops.redo': {
    nargs: 1,
    default: 0,
    desc: 'Repeat also if directory existRepeat also if directory existss'
  }
};

