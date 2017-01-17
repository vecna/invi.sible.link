var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('route:getTasks');
var nconf = require('nconf');
 
var mongo = require('../lib/mongo');

function markVantagePoint(vp, siteList) {
    
    return Promise.map(siteList, function(s) {
        _.set(s, vp, false);

        return mongo.upsertOne(nconf.get('schema').promises, {
            id: s.id
        }, s);
    });
};

/* this function is constantly called, like, every minute, 
 * through this function might be possible organize a coordinated
 * test to the same site in the same moment from N-vantage points */
function getTasks(req) {

    var vantagePoint = req.params.vantagePoint;
    var amount = _.parseInt(req.params.amount);

    debug("%s getTasks max %d from %s",
        req.randomUnicode, amount, vantagePoint);

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
        .then(function(taskList) {
            return markVantagePoint(vantagePoint, taskList)
                .tap(function(marked) {
                    debug("taskList returns %d tasks updated for VP [%s]",
                        _.size(taskList), vantagPoint);
                })
                .return({
                    json: taskList
                });
        });
};

module.exports = getTasks;
