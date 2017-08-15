var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('route:getSubjectsStats');
var nconf = require('nconf');
var moment = require('moment');
 
var mongo = require('../lib/mongo');
var subjectsOps = require('../lib/subjectsOps');

function countPromises(timet) {
    return mongo
        .countByDay(nconf.get('schema').promises, '$start', { start: { "$gt": timet} }, { campaign: "$taskName" })
        .map(amountify)
        .map(function (x) {
            return _.extend(x, {kind: 'promises'});
        });
}

function countEvidences(timet) {
    return mongo
        .countByDay(nconf.get('schema').evidences, '$when', { when: { "$gt": timet} }, { campaign: "$campaign" })
        .map(amountify)
        .map(function (x) {
            return _.extend(x, {kind: 'evidences'});
        });
};

function countSurface(timet) {
    return mongo
        .countByDay(nconf.get('schema').surface, '$when', { when: { "$gt": timet} }, { campaign: "$campaign" })
        .map(amountify)
        .map(function (x) {
            return _.extend(x, {kind: 'surface'});
        });
};

function amountify(y) {
    return {
        date : y["_id"].year + "-" + y["_id"].month + "-" + y["_id"].day,
        campaign: y["_id"].campaign,
        amount: y.count
    }
}

function getSubjectsStats(req) {
    var campaign = _.get(req.params, 'campaign');

    var filter = { 'public': true };
    if(campaign) {
	debug("campaign %s", campaign);
        filter = _.extend(filter, campaign);
    }
    var timet = new Date(moment().subtract(7, 'd').format("YYYY-MM-DD") );

    return Promise
        .all([ countPromises(timet), countEvidences(timet), countSurface(timet) ])
        .then(_.flatten)
        .then(function(infos) {
            return { json: infos };
        });
};

module.exports = getSubjectsStats;
