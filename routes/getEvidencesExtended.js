var _ = require('lodash');
var debug = require('debug')('route:getEvidencesExtended');
var moment = require('moment');
var nconf = require('nconf');

var mongo = require('../lib/mongo');
 
/* This API return all the evidences, selected by campaign named.
 * the 'extended' part is because the google services are named separately.
 */

function fetchEvidences(filter) {
    return mongo
        .read(nconf.get('schema').evidences, filter);
}

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

    if(e.url.match(/mapsapi/))
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

    console.log(e.subdomain, '-', e.domain, '-', e.url, "(", e.href, ")");
    return "Google";
};

function getEvidencesExtended(req) {

    var DAYSAGO = 0
    var min = moment()
            .subtract(DAYSAGO +1, 'd')
            .startOf('day')
            .format("YYYY-MM-DD");

    var max = moment()
            .subtract(DAYSAGO, 'd')
            .startOf('day')
            .format("YYYY-MM-DD");

    debug("gte %s lt %s", min, max);
    var filter = {  campaign : req.params.campaign,
                    when : { '$gte': new Date(min), '$lt': new Date(max) }
                };

    var omitf = [ "VP", "_id", "campaign", "urlId", 
        "id", "tld", "promiseId", "subdomain", "version", "ETag",
        "proprietary", "domainId", "domain", "Last-Modified", "Date", "relationId" ];

    return fetchEvidences(filter)
        .map(function(e) {
            /* this field is "product" and at the moment is valorized differently only for 
             * Google: to diversify the different kind of products Mama-G has */
            if(e.company)
                e.product = attributeProduct(e);
            return _.omit(e, omitf);
        })
        .then(function(c) {
            debug("Evidences returned is %d", _.size(c));
            return { 'json': c };
        });
};

module.exports = getEvidencesExtended;
