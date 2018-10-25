var _ = require('lodash');
var Promise = require('bluebird');
var moment = require('moment');
var debug = require('debug')('route:getTaskById');
var nconf = require('nconf');
 
var mongo = require('../lib/mongo');

/* this function is like getTask but pick a specific promise */
function getTaskById(req) {

    var vantagePoint = req.params.vantagePoint;
    var id = req.params.id;
    var type = req.params.type;
    var selector = { id: id };

    debug("getTaskById %s (ignored VP %s and type %s)", selector, vantagePoint, type);

    return mongo
        .readLimit(nconf.get('schema').promises, selector, {}, 1, 0)
        .then(function(taskList) {
            return {
                json: [ _.omit(_.first(taskList), ['subjectId', 'start', 'id', 'description', 'rank', '_id' ]) ]
            };
        });
};

module.exports = getTaskById;
