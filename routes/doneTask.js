var _ = require('lodash');
var debug = require('debug')('doneTask');
var nconf = require('nconf');
 
var mongo = require('../lib/mongo');

function doneTask(req) {
    /* switch the $VantagePoint: false to true */

    var vantagePoint = req.params.vantagePoint;
    var id = req.params.id;

    return mongo
        .read(nconf.get('schema').promises, {id: id})
        .then(_.first)
        .then(function(solved) {
            if(solved[vantagePoint] !== false)
                debug("Anomaly in %s %d = %j", id, vantagePoint, solved);

            solved[vantagePoint] = true;

            return mongo
                .upsertOne(nconf.get('schema').promises, {
                    "id": solved.id,
                }, solved);
        })
        .return({ json: { 'result': 'OK' }});
};

module.exports = doneTask;
