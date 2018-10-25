var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('route:getResult');
var moment = require('moment');
var nconf = require('nconf');

var mongo = require('../lib/mongo');
 
function getResult(req) {
    var filter = { page: 'http://' + req.params.site };
    debug("looking for: %s", JSON.stringify(filter));
    return mongo
        .read(nconf.get('schema').monosite, filter)
        .then(_.first)
        .then(function(sites) {
            return {
                'json': _.omit(sites, ['data'])
            }
        });
};

module.exports = getResult;
