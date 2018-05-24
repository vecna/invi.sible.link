var _ = require('lodash');
var debug = require('debug')('route:getEvidencesExtended');
var moment = require('moment');
var nconf = require('nconf');

var mongo = require('../lib/mongo');
var google = require('../lib/google');
 
/* This API return all the evidences, selected by campaign named.
 * the 'extended' part is because the google services are named separately.
 */

function fetchEvidences(filter) {
    return mongo
        .read(nconf.get('schema').evidences, filter);
}

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
    var filter = {  when : { '$gte': new Date(min), '$lt': new Date(max) } };
    _.set(filter, 'campaign', req.params.campaign);

    var omitf = [ "VP", "_id", "campaign", "urlId", 
        "id", "tld", "promiseId", "subdomain", "version", "ETag",
        "proprietary", "domainId", "domain", "Last-Modified", "Date", "relationId" ];

    return fetchEvidences(filter)
        .map(function(e) {
            /* this field is "product" and at the moment is valorized differently only for 
             * Google: to diversify the different kind of products Mama-G has */
            if(e.company)
                e.product = google.attributeProduct(e);
            return _.omit(e, omitf);
        })
        .then(function(c) {
            debug("Evidences returned is %d", _.size(c));
            return { 'json': c };
        });
};

module.exports = getEvidencesExtended;
