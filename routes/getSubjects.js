var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('route:getSubjects');
var nconf = require('nconf');
 
var mongo = require('../lib/mongo');
var subjectsOps = require('../lib/subjectsOps');

function getSubjects(req) {
    var campaign = _.get(req.params, 'campaign');

    var filter = { 'public': true };
    if(campaign)
        filter = _.extend(filter, campaign);

    debug("Using filter %j in case of wildcard test of the route", filter);
    return mongo
        .read(nconf.get('schema').subjects, filter)
        .then(function(subjects) {
            debug("%s getSubjects filter %j = %d",
                req.randomUnicode, filter, _.size(subjects));
            return {
                json: subjectsOps.serializeLists(subjects)
            };
        });
};

module.exports = getSubjects;
