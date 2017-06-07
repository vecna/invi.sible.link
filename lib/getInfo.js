var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var debug = require('debug')('lib:getInfo');
var nconf = require('nconf');

var mongo = require('./mongo');

function lastDayCount(columnName, tv) {

    var sorter = {};
    _.set(sorter, tv, -1);
    return mongo
        .readLimit(columnName, {}, sorter, 1, 0)
        .then(function(lro) {
            var rawob = _.first(lro);
            var day = moment(_.get(rawob, tv)).format("YYYY-MM-DD");
            return {
                name: columnName,
                count: 0,
                timeVar: tv,
                dayStr: day,
                last: rawob
            };
        })
        .then(function(elab) {
            var selector = {};
            selector[elab.timeVar] = {
                '$gte': new Date( elab.dayStr ),
                '$lt': new Date( moment(elab.dayStr)
                                 .add(1, 'd')
                                 .toISOString() )
            }
            return Promise.all([
                elab,
                mongo.count(elab.name, selector)
            ]);
        })
        .then(function(full) {
            content = full[0];
            content.count = full[1];
            return content;
        });
};

module.exports = {
    lastDayCount: lastDayCount
};
