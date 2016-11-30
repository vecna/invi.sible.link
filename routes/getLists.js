var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('getList');
var nconf = require('nconf');
 
var mongo = require('../lib/mongo');

function getList(req) {
    /* don't take any option yet */
    debug("%s getList", req.randomUnicode);

    return mongo
        .read(nconf.get('schema').lists)
        .then(function(lists) {
            return {
                json: lists
            };
        });
};

module.exports = {
    getList: getList
};
