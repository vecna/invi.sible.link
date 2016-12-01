var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('getList');
var nconf = require('nconf');
 
var mongo = require('../lib/mongo');

function getLists(req) {
    /* don't take any option yet */
    debug("%s getLists", req.randomUnicode);

    return mongo
        .read(nconf.get('schema').lists, {
            'public': true
        })
        .map(function(singleList) {
            return _.pick(singleList, ['id', 'name', 'source']);
        })
        .then(function(lists) {
            return {
                json: lists
            };
        });
};

module.exports = getLists;
