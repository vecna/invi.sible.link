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

    debug("getTaskById %s (ignored %s and %s)",
        id, vantagePoint, type);

    var selector = { id: id };

    return mongo
        .readLimit(nconf.get('schema').promises, selector, {}, 1, 0)
        .then(function(taskList) {
            var info = _.map(taskList, function(t) {
                return _.omit(t, ['subjectId', 'start', 'id', 'description', 'rank', '_id' ]);
            });
            debug("returning %d tasks [%s]", _.size(taskList), taskList[0].href);
            return {
                json: taskList
            };
        });
};

module.exports = getTaskById;
