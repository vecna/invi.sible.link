var _ = require('lodash');
var Promise = require('bluebird');
var moment = require('moment');
var debug = require('debug')('route:getTasks');
var nconf = require('nconf');
 
var mongo = require('../lib/mongo');
var updateVP = require('../lib/updateVP');


/* this function is constantly called, like, every minute, 
 * through this function might be possible organize a coordinated
 * test to the same site in the same moment from N-vantage points */
function getTasks(req) {

    var vantagePoint = req.params.vantagePoint;
    var amount = _.parseInt(req.params.amount);
    var type = req.params.type;

    debug("getTasks %d from %s type %s", amount, vantagePoint, type);

    /* this is redundant with lib/promises, but here there is 
     * specify the vantagePoint filter below */
    var selector = {
        "start": { $lt: new Date(),
                   $gt: new Date( moment().startOf('day').subtract(1, 'm').toISOString() ) },
        "needName": type
    };
    _.set(selector, vantagePoint, { "$exists": false });

    return mongo
        .readLimit(nconf.get('schema').promises, selector, {}, amount, 0)
        .tap(function(d) {
            debug("retrieved %d .promises with selector %j", _.size(d), selector);
        })
        .then(function(taskList) {
            return updateVP.byList(taskList, vantagePoint, false)
                .then(function(c) {
                    if(!_.size(c))
                        debug("_________ %s", vantagePoint);
                    else
                        debug("taskList returns %d tasks updated for VP [%s]",
                            _.size(c), vantagePoint);
                    return {
                        json: c 
                    };
                });
        });
};

module.exports = getTasks;
