var _ = require('lodash');
var moment = require('moment');
var debug = require('debug')('route:activeTasks');
var nconf = require('nconf');
 
var mongo = require('../lib/mongo');

function increment(destd, fk, sk) {
    if(_.isUndefined(_.get(destd[fk], sk))) {
        destd[fk][sk] = 1;
    } else {
        destd[fk][sk] += 1;
    }
}

function activeTasks(req) {

    var vantagePoint = req.params.vantagePoint;
    var amount = _.parseInt(req.params.amount);

    debug("%s activeTasks max %d from %s",
        req.randomUnicode, amount, vantagePoint);

    var twodaysago = moment().subtract(2, 'd');
    var selector = { "end": { "$gt": new Date(twodaysago) } };

    return mongo
        .read(nconf.get('schema').promises, selector)
        .map(function(site) {

            var checks = {
                'today': 0,
                'yestarday': 24,
                'two days ago': 48
            };
            site.day = _.reduce(checks, function(ret, amount, when) {
                if(ret)
                    return ret;

                if( moment().subtract(amount, 'h').isBetween( moment(site.start), moment(site.end) ) ) {
                    // debug("%s marking yes! %s", moment.duration( moment() - moment(site.start) ).humanize(), when);
                    return when;
                }
                return ret;
            }, null);

            return _.omit(site, ['_id', 'start', 'end']);
        })
        .then(_.flatten) 
        .then(function(taskList) {

            var VPs = nconf.get('expected');
            debug("Sorting promises/tasks using these Vantage Points: %j", VPs);
            if(!_.size(VPs))
                throw new Error("Someone has forget to configure the 'expected' in config");

            var c = _.reduce(taskList, function(memo, task) {
                increment(memo, task.day, 'total');
                _.each(VPs, function(vp) {
                    var test = _.get(task, vp);
                    if(test === false)
                        increment(memo, task.day, '!' + vp);
                    if(test === true)
                        increment(memo, task.day, vp);
                });
                return memo;
            }, {
                'today': { 'when': 'today' },
                'yestarday': { 'when': 'yesterday'  } ,
                'two days ago': { 'when': 'two days ago' }
            });
            return { json: _.values(c) };
        });
};

module.exports = activeTasks;
