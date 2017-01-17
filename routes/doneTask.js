var _ = require('lodash');
var debug = require('debug')('route:doneTask');
var nconf = require('nconf');
 
var mongo = require('../lib/mongo');

function doneTask(req) {
    /* switch the $VantagePoint: false to true */

    var vantagePoint = req.params.vantagePoint;
    var id = req.params.id;

    return mongo
        .read(nconf.get('schema').promises, {id: id})
        .tap(function(anomaly) {
            if(_.size(anomaly) !== 1) {
                /* this happen when the same website has been set more than once per day */
                debug("Anomaly1, dup: for subject %s %s (amount %d)?",
                    anomaly.subjectId, anomaly.url, _.size(anomaly) );
                /* This is not ok because below is used _.first and this will screw up align */
            }
        })
        .then(_.first)
        .then(function(solved) {
            if(solved[vantagePoint] !== false) {
                debug("Anomaly2: %s VP %s not false in %j", id, vantagePoint, solved);
            }

            solved[vantagePoint] = true;

            return mongo
                .upsertOne(nconf.get('schema').promises, {
                    "id": solved.id,
                }, solved);
        })
        .return({ json: { 'result': 'OK' }});
};

module.exports = doneTask;
