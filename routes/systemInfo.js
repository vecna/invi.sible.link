var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('systemInfo');
var os = require('os');
var disk = Promise.promisifyAll(require('diskusage'));
var nconf = require('nconf');
 
var mongo = require('../lib/mongo');

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
            return disk
                .checkAsync('/')
                .then(function(freebytes) {
                    return {
                        json: {
                            columns: namedNumbers,
                            disk: freebytes,
                            loadavg: os.loadavg(),
                            totalmem: os.totalmem(),
                            freemem: os.freemem()
                        }
                    };
                });
        });
};

module.exports = systemInfo;
