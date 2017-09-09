var _ = require('lodash');
var moment = require('moment');
var debug = require('debug')('promises');
var nconf = require('nconf');

var mongo = require('./mongo');

function retrieve(daysago, preFilter) {

    var when = moment().startOf('day');

    if(daysago) {
        when.subtract(_.parseInt(daysago), 'd');
        debug("DAYSAGO specify: %s", when);
    }

    debug("Looking for promises on %s",
        when.format("YYYY-MM-DD"));

    if(preFilter && !_.isObject(preFilter))
        throw new Error("preFilter has to be an Object");

    var filter = {
        "start": { "$gte": new Date( when.toISOString() ) }
    };

    if(preFilter)
        filter = _.extend(preFilter, filter);

    return mongo.read(nconf.get('schema').promises, filter);
};

module.exports = {
    retrieve: retrieve
};
