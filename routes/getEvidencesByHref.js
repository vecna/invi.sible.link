var _ = require('lodash');
var debug = require('debug')('route:getEvidencesByHref');
var moment = require('moment');
var nconf = require('nconf');

var mongo = require('../lib/mongo');
 
/* This API return all the evidences, to display the historical changes
 * with a C3 graph (time, VP and number/kind of trackers are part of the 
 * visualization) 
 */
function getEvidencesByHref(req) {

    var maxDays = 15;
    var filter = {};
    var MAX = 21000;

    filter.when = { '$gt': new Date( moment()
            .subtract(maxDays, 'd')
            .format("YYYY-MM-DD") 
        ) };
    filter.href = new RegExp(req.params.href);

    var omitf = [ "_id", "domain", "id", "kind", "tld", "domainId",
                  "phantom", "disk", "macheteTiming", "subdomain", "version" ];

    debug("getEvidencesByHref with filter %j", filter);
    return mongo
        .readLimit(nconf.get('schema').evidences, filter, { when: -1 }, MAX, 0)
        .map(function(e) {
            e.da = _.parseInt(moment.duration(moment() - moment(e.when)).asDays() );
            return _.omit(e, omitf);
        })
        .then(function(C) {
            if(_.size(C) === MAX)
                debug("Warning! reach readLimit limit of %d", MAX);
            var grouped =  _.groupBy(C, 'da');
            debug("getEvidencesByHref group %d days", _.size(grouped));
            /* reminder: before was returned 'grouped' but there is not sense */
            return { 'json': C };
        });
};

module.exports = getEvidencesByHref;
