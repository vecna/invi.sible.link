var _ = require('lodash'),
    debug = require('debug')('lib.domain'),
    tld = require('tld');

var cleanHost = function(href) {
    if(href.indexOf('//') == -1) { return null; }
    var cleanHost = href.split('//')[1].split('/')[0];
    return (cleanHost.indexOf(':') == -1) ? cleanHost : cleanHost.split(':')[0];
};

var domainTLDinfo = function(links) {
    return _.reduce(links, function(memo, linkObj) {
        try {
          linkObj.host = cleanHost(linkObj.href);
          linkObj.domain = tld.registered(linkObj.host);
        } catch(e) {
          debug("domainTLDinfo spot a broken inclusion %j", linkObj);
          return memo;
        }
        memo.push(linkObj);
        return memo;
    }, []);
};

module.exports = {
    domainTLDinfo: domainTLDinfo,
    cleanHost: cleanHost
};
