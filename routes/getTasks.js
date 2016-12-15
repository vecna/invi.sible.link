var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('getTasks');
var nconf = require('nconf');
 
var mongo = require('../lib/mongo');

function markVantagePoint(vp, siteList) {
    
    return Promise.map(siteList, function(s) {
        var update = _.set({}, vp, false);

        return mongo.upsertOne(nconf.get('schema').promises, {
            id: s.id
        }, update);
    });
};

/* this function is constantly called, like, every minute, 
 * through this function might be possible organize a coordinated
 * test to the same site in the same moment from N-vantage points */
function getTasks(req) {

    var vantagePoint = req.params.vantagePoint;
    var amount = _.parseInt(req.params.amount);

    debug("%s %s asks getTasks %d",
        req.randomUnicode, vantagePoint, amount);

    var selector = {
        "start": { "$lt": new Date() },
        "end": { "$gt": new Date() }
    };
    _.set(selector, vantagePoint, { "$exists": false });

    return mongo
        .readLimit(nconf.get('schema').promises, selector, {}, amount, 0)
        .map(function(site) {
            return _.omit(site, ['_id']);
        })
        .then(function(siteList) {
            return markVantagePoint(vantagePoint, siteList)
                .return({
                    json: siteList
                });
        });
};

module.exports = getTasks;
