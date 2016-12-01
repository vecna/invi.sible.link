var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('getList');
var nconf = require('nconf');
 
var mongo = require('../lib/mongo');
var listsOps = require('../lib/listsOps');

function getLists(req) {
    /* don't take any option yet */
    debug("%s getLists", req.randomUnicode);

    return mongo
        .read(nconf.get('schema').lists, {
            'public': true
        })
        .then(function(lists) {
            return {
                json: listsOps.serializeLists(lists)
            };
        });
};

module.exports = getLists;
