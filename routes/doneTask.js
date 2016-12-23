var _ = require('lodash');
var debug = require('debug')('doneTask');
var nconf = require('nconf');
 
var mongo = require('../lib/mongo');

function doneTask(req) {
    /* switch the $VantagePoint: false to 'true' */

    var vantagePoint = req.params.vantagePoint;
    var id = _.parseInt(req.params.id);

    debug("%s %s tell doneTask %s",
        req.randomUnicode, vantagePoint, id);

    var update = _.set({}, vantagePoint, true);
    return mongo
        .upsertOne(nconf.get('schema').promises, {
            "id": id,
        }, update)
        .then(function(retval) {
            debug("return %j", retval);
            return { json: { 'result': 'OK' }};
        });
};

module.exports = doneTask;
