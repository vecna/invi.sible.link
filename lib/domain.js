var _ = require('lodash'),
    debug = require('debug')('lib.domain'),
    tld = require('tld');

var cleanHost = function(href) {
    if(href.indexOf('//') == -1) { return null; }
    var cleanHost = href.split('//')[1].split('/')[0];
    return (cleanHost.indexOf(':') == -1) ? cleanHost : cleanHost.split(':')[0];
};

var domainTLDinfo = function(links) {
    _.each(links, function(linkObj) {
        if (linkObj.href == undefined) { debugger; }
        linkObj.host = cleanHost(linkObj.href);
        linkObj.domain = tld.registered(linkObj.host);
    });
    return links;
};

module.exports = {
    domainTLDinfo: domainTLDinfo
};