var _ = require('lodash');
var Promise = require('bluebird');
var moment = require('moment');
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
    var type = req.params.type;

    debug("%s getTasks max %d from %s by %s",
        req.randomUnicode, amount, vantagePoint, type);

    /* this is redundant with lib/promises, but here there is 
     * specify the vantagePoint filter below */
    var selector = {
        "start": new Date( moment().startOf('day').format("YYYY-MM-DD")),
        "needName": type
    };
    _.set(selector, vantagePoint, { "$exists": false });

    return mongo
        .readLimit(nconf.get('schema').promises, selector, {}, amount, 0)
        .then(function(taskList) {
            return markVantagePoint(vantagePoint, taskList)
                .tap(function(marked) {
                    if(!_.size(taskList))
                        debug("_________ %s", vantagePoint);
                    else
                        debug("taskList returns %d tasks updated for VP [%s]",
                            _.size(taskList), vantagePoint);
                })
                .return({
                    json: taskList
                });
        });
};

module.exports = getTasks;
