var _ = require('lodash');
var moment = require('moment');
var debug = require('debug')('promises');
var nconf = require('nconf');

var mongo = require('./mongo');

function retrieve(daysago, preFilter) {

    var when = moment().startOf('day');
    var filter;

    if(daysago)
        when.substract(_.parseInt(daysago), 'd');

    debug("Looking for promises for the day %s",
        when.format("YYYY-MM-DD"));

    if(preFilter && !_.isObject(preFilter))
        throw new Error("preFilter has to be an Object");

    if(preFilter) {
        filter = _.extend(preFilter, {
            "start": new Date( when.format("YYYY-MM-DD") )
        });
    } else {
        filter = {
            "start": new Date( when.format("YYYY-MM-DD") )
        }
    }
    return mongo.read(nconf.get('schema').promises, filter);
};

module.exports = {
    retrieve: retrieve
};
