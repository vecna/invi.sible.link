var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('route:systemInfo');
var os = require('os');
var nconf = require('nconf');

var mongo = require('../lib/mongo');
var cmdSpawn = require('../lib/cmdspawn');

/* 
 * this is the API call by bin/statusChecker.js
 * configured by config/statusChecker.json
 * and this API returns the statistics who gets recorded */

function systemInfo(req) {
    debug("%s systemInfo", req.randomUnicode);

    return Promise
        .map(_.values(nconf.get('schema')), function(tableName) {
            return mongo.countByObject(tableName);
        })
        .then(function(dbcounts) {
            return _.reduce(nconf.get('schema'), function(memo, cN, name) {
                var o = _.first(_.nth(dbcounts, _.size(memo)));
                memo[name] = _.isUndefined(o) ? "0" : o.count;
                return memo;
            }, {});
        })
        .then(function(namedNumbers) {
            return { json: {
                columns: namedNumbers,
                loadavg: os.loadavg(),
                totalmem: os.totalmem(),
                freemem: os.freemem(),
            }};
        });
}

module.exports = systemInfo;
