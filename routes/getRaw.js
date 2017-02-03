var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('route:getRaw');
var moment = require('moment');
var nconf = require('nconf');
var mongo = require('../lib/mongo');
 
/* This API return a reduction of evidences used by c3, it is used to show the sources of third parties */
function getRaw(req) {

    var column = req.params.column;
    var key = req.params.key;
    var value = req.params.value;

    debug("Looking for %s:%s in %s", key, value, column);

    var filter = _.set({ when: { 
        "$gt": new Date(moment().subtract(1, 'd').format('YYYY-MM-DD'))
    } }, key, value);

    return mongo
        .read(column, filter)
        .then(function(content) {
            debug("Returning %d objects", _.size(content));
            return {
                'json': content
            }
        });
};

module.exports = getRaw;
