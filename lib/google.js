var _ = require('lodash');
var debug = require('debug')('lib:google');
var moment = require('moment');
var nconf = require('nconf');

function attributeProduct(e) {
    if(e.company !== 'Google') 
        return e.company;

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

    if(e.url.match(/mapsapi/) || e.subdomain === 'maps')
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

    debug("unmanage condition: %s|%s|%s|%s", e.subdomain, e.domain, e.url, e.href);
    return "Google";
};

module.exports = { attributeProduct: attributeProduct };
