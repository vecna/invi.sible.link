var _ = require('lodash');
var Promise = require('bluebird');
var moment = require('moment');
var debug = require('debug')('route:getMandatoryTasks');
var nconf = require('nconf');
 
var mongo = require('../lib/mongo');

/* this function ignore the vantage point status, it
 * simply return the tasks matching the start time */
function getMandatoryTasks(req) {

    var vantagePoint = req.params.vantagePoint;
    var amount = _.parseInt(req.params.amount);
    var type = req.params.type;

    debug("%s getMandatoryTasks max %d from %s %s",
        req.randomUnicode, amount, vantagePoint, type);

    /* this is redundant with lib/promises, but here there is 
     * specify the vantagePoint filter below */
    var selector = {
        "start": new Date( moment().startOf('day').format("YYYY-MM-DD")),
        needName: type
    };

    return mongo
        .readLimit(nconf.get('schema').promises, selector, {}, amount, 0)
        .then(function(taskList) {
            var info = _.map(taskList, function(t) {
                return _.omit(t, ['subjectId', 'start', 'id', 'description', 'rank', '_id' ]);
            });
            debug("returning %d tasks, status: %s",
                _.size(taskList), JSON.stringify(info, undefined, 2));
            return {
                json: taskList
            };
        });
};

module.exports = getMandatoryTasks;
