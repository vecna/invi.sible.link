var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('route:getRetrieved');
var nconf = require('nconf');
 
var mongo = require('../lib/mongo');

function getRetrieved(req) {

    /* what is the name of the column, id is the correspondent native id of the task */
    var what = req.params.what;
    var id = req.params.id;

    debug("%s getRetrieved from %s of %s",
        req.randomUnicode, what, id);

    if (_.keys(nconf.get('schema')).indexOf(what) === -1) {
        throw new Error("Not found column", what);
    }

    return mongo
        .read(nconf.get('schema')[what], {id: id})
        .then(function(selist) {
            var x = _.omit(_.first(selist), ['_id']);
            return { json: x };
        });
};

module.exports = getRetrieved;
