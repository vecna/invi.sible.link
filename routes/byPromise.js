var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('route:byPromise');
var moment = require('moment');
var nconf = require('nconf');
 
var mongo = require('../lib/mongo');

function byPromise(req) {

    var promiseId = req.params.promiseId;
    var filter = { promiseId: promiseId };

    debug(" %s byPromise, filter %j", req.randomUnicode, filter);

    return mongo
        .read(nconf.get('schema').phantom, filter)
        .map(function(ret) {
            return _.omit(ret, ['_id']);
        })
        .then(function(rets) {
            return{
                json: rets
            };
        });
};

module.exports = byPromise;
