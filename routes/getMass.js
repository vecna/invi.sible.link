var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('route:getMass');
var nconf = require('nconf');
 
var mongo = require('../lib/mongo');

function getMass(req) {

    var columnN = req.body.column;
    var query = req.body.query;

    debug(" %s getMass on %s of %j",
        req.randomUnicode, columnN, query);

    return mongo
        .read(nconf.get('schema')[columnN], query)
        .map(function(ret) {
            return _.omit(ret, ['_id']);
        })
        .then(function(rets) {
            return{
                json: rets
            };
        });
};

module.exports = getMass;
