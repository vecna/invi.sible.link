var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('route:getStats');
var nconf = require('nconf');
var moment = require('moment');
 
var mongo = require('../lib/mongo');

function transform(coll) {
   
    var byDate = _.reduce(coll, function(memo, entry) {
        var W = moment(entry.when).format("YYYY-MM-DD HH:mm");

        if(!memo[W])
            memo[W] = { date: moment(entry.when).format("YYYY-MM-DD HH:mm") };
            
        if(_.size(entry.name) <= 3) {
            /* is a Vantage Point, the only with 'saved' */
            _.set(memo[W], entry.name + 'saved', entry.phantom);
        } 
        _.set(memo[W], entry.name + 'accesses', entry.accesses);
        _.set(memo[W], entry.name + 'free', _.round(entry.free / 1024) );
        _.set(memo[W], entry.name + 'total', _.round(entry.total / 1024) );
        return memo;
    }, {});
    return _.values(byDate);
};

function getStats(req) {
    /* don't take any option yet */

    var hoursAgo= _.parseInt(req.params.hours);
    var isofmt = moment().subtract(hoursAgo, 'h').toISOString();
    var filter = { task: 'statistics', when: { "$gt": new Date(isofmt) }};
    debug("getStats since %d hours ago, filter %j", hoursAgo, filter);

    return mongo
        .read(nconf.get('schema').statistics, filter)
        .then(function(infos) {
            debug("%s getStats = %d entries", req.randomUnicode, _.size(infos));
            return {
                json: transform(infos)
            };
        });
};

module.exports = getStats;
