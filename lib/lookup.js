var _ = require('lodash');

/*
 * Lookup module take aslways all the datainput as argument
 * and an hash, based on the function called, different part of the
 * datainput are kept in account when performed the lookup 
 */

var inFetchInfo = function(di, hrefHash) {
    return _.find(di.data, function(siteData) {
        return ( siteData.fetchInfo !== null &&
                 siteData.fetchInfo.href_hash === hrefHash ) ;
    });
};

var inSource = function(di, hrefHash) {
    return _.find(di.source, function(siteEntry) {
        return (siteEntry._ls_links[0]._ls_id_hash === hrefHash);
    });
};

module.exports = {
  inFetchInfo: inFetchInfo,
  inSource: inSource
}
