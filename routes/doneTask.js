var _ = require('lodash');
var debug = require('debug')('route:doneTask');
var nconf = require('nconf');
 
var mongo = require('../lib/mongo');

function doneTask(req) {
    /* switch the $VantagePoint: false to true */

    var vantagePoint = req.params.vantagePoint;
    var id = req.params.id;
    var type = req.params.type;

    return mongo
        .read(nconf.get('schema').promises, {id: id, needName: type})
        .tap(function(anomaly) {
            if(_.size(anomaly) !== 1) {
                /* this happen when the same website has been set 
                 * more than once per day, and has not to happen anymore */
                debug("Anomaly1, dup: id %s subject %s %s (amount %d)? _id %s",
                    id,
                    anomaly[0].subjectId,
                    anomaly[0].url,
                    _.size(anomaly),
                    anomaly[0]._id );
            }
        })
        .then(_.first)
        .then(function(solved) {
            if(solved[vantagePoint] !== false) {
                debug("Anomaly2: %s VP %s not false in %j",
                    id, vantagePoint, solved);
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
