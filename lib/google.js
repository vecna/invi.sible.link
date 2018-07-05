var _ = require('lodash');
var debug = require('debug')('lib:google');
var moment = require('moment');
var nconf = require('nconf');

function valorizeGoogle(response) {
    response.data = _.map(response.data, function(evidence) {
        var service = attributeProduct(evidence);
        if(service)
            evidence.product = service;
        return evidence;
    });
    return response;
}

function attributeProduct(e) {
    if(e.company !== 'Google') 
        return null;

    if(e.url.match(/fonts\./))
        return "Google Fonts";
   
    if(e.domain === 'doubleclick' || e.domain === '2mdn')
        return "Google DoubleClick";

    if(e.domain === 'google-analytics')
        return "Google Analytics";

    if(e.domain === 'googletagmanager' || e.domain === 'googletagservices')
        return "Google Tag Manager";

    if(e.domain === 'googleadservices' || e.subdomain === 'adservice')
        return "Google ADS";
    if(e.url.match(/\/ads\//))
        return "Google ADS";
    if(e.url.match(/\/adsense/) || e.url.match(/\/domainads\//) || e.url.match(/\/pagead\//))
        return "Google ADS";

    if(e.url.match(/translate\.google/))
        return "Google translate";

    if(e.url.match(/\/recaptcha\//))
        return "Google Captcha";

    if(e.domain === 'youtube' || e.domain === 'youtu' || e.domain === 'ytimg')
        return "YouTube (Google)";

    if(e.url.match(/mapsapi/) || e.url.match(/\/maps\//) || e.subdomain === 'maps')
        return "Google Maps";

    if(e.domain === 'googlesyndication')
        return "Google webmaster tools";

    if(e.subdomain === 'ampcid')
        return "Google AMP";

    if(e.domain === 'blogger' || e.domain === 'blogspot' || e.domain === 'blogblog')
        return "BlogSpot (Google)";

    if(e.url.match(/plusone/) || e.url.match(/\/\+1\//))
        return "Google +1";

    if(e.domain === 'gstatic')
        return "Google CDN";

    if(e.subdomain === 'accounts')
        return "Login with Google";

    if(e.subdomain === 'ajax' && e.domain ==='googleapis')
        return "Google Loader";

    debug("unmanage condition: %s|%s|%s|%s", e.subdomain, e.domain, e.url, e.href);
    return "Google";
};

function composeList(sits, evidences) {

    var stats = { targetMatch: 0, googles: 0, missing: 0 };

    /* logic is:
        - iterated on the configured `sites` from mix[2]
        - look if any Google reference is present there
        - look if the target:true is present there
     */
    var ret = _.reduce(sites, function(memo, p) {
        var t = _.find(evidences, { href: p.href, target: true });
        if(t) {
            stats.targetMatch++;
            t.description = p.description;
            memo.push(t);
        }
        var gugls = _.filter(evidences, { href: p.href, company: "Google" });
        if(_.size(gugls)) {
            stats.googles += _.size(gugls);
            var ready = _.map(gugls, function(g) {
                g.description = p.description;
                return g;
            });
            return _.concat(memo, ready);
        } else {
            stats.missing++;
            memo.push(_.extend(_.pick(p, [ "href", "description" ]), { empty: true }));
            return memo;
        }
    });

    debug("Reduction of %d sites configured with %d evidences collected, total %d: %j",
        _.size(sites), _.size(evidences), _.size(ret), stats);
    return ret;
};

module.exports = {
    attributeProduct: attributeProduct,
    composeList: composeList,
    valorizeGoogle: valorizeGoogle
};
