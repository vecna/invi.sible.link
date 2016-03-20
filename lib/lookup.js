var _ = require('lodash');

/*
 * Lookup module take datainput or staticInput (or both) as argument
 * and an hash, based on the function called, different sections of the
 * datainput are kept in account when performed the lookup 
 */

var inFetchInfo = function(di, hrefHash) {
    return _.find(di.data, function(siteData) {
        return ( siteData.fetchInfo !== null &&
                 siteData.fetchInfo.href_hash === hrefHash ) ;
    });
};

var inSourceByInput = function(di, inputHash) {
    return _.find(di.source, function(siteEntry) {
        return (siteEntry.input_hash == inputHash);
    });
};

var inFetchByInput = function(di, inputHash) {
    var siteEntry = inSourceByInput(di, inputHash);
    if (_.isUndefined(siteEntry))
        return siteEntry;
    return inFetchInfo(di, siteEntry._ls_links[0]._ls_id_hash);
};

var inSource = function(di, hrefHash) {
    return _.find(di.source, function(siteEntry) {
        return (siteEntry._ls_links[0]._ls_id_hash === hrefHash);
    });
};

var inStatic = function(si, inputHash) {
    return _.find(si.world, function(crawledEntry) {
        return (crawledEntry.input_hash === inputHash);
    });
};

module.exports = {
  inFetchInfo: inFetchInfo,
  inSourceByInput: inSourceByInput,
  inFetchByInput: inFetchByInput,
  inSource: inSource,
  inStatic: inStatic
};
