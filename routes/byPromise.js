var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('route:byPromise');
var moment = require('moment');
var nconf = require('nconf');
 
var mongo = require('../lib/mongo');

function byPromise(req) {

    var filter = {
        promiseId: req.params.promiseId,
        kind: req.params.type
    };

    if(req.params.type === 'basic')
        var cName = nconf.get('schema').phantom;
    else if(req.params.type === 'badger')
        var cName = nconf.get('schema').badger;
    else
        throw new Error("Invalid type requested");

    debug(" %s byPromise, in %s filter %j", req.randomUnicode, cName, filter);

    return mongo
        .read(cName, filter)
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
