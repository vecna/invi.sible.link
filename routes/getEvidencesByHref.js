var _ = require('lodash');
var Href = require('bluebird');
var debug = require('debug')('route:getEvidencesByHref');
var moment = require('moment');
var nconf = require('nconf');

var mongo = require('../lib/mongo');
 
/* This API return all the evidences, to display the historical changes
 * with a C3 graph (time, VP and number/kind of trackers are part of the 
 * visualization) 
 */
function getEvidencesByHref(req) {

    var filter = { domaindottld: req.params.href };
    var days = 1;

    filter.when = { '$gt': new Date( moment()
            .subtract(days, 'd')
            .format("YYYY-MM-DD") 
        ) };

    debug("getEvidencesByHref →  with filter %j on last %d days",
        filter, days);

    return mongo
        .readLimit(nconf.get('schema').evidences, filter, {
            when: -1
        }, 5000, 0)
        .then(function(C) {
            if(_.size(C) === 5000)
                debug("Warning! reach readLimit limit of 5k");
            return { 'json': C };
        });
};

module.exports = getEvidencesByHref;
