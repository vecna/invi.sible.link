var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('route:getStats');
var nconf = require('nconf');
var moment = require('moment');
 
var mongo = require('../lib/mongo');

function transform(coll) {
  
    var formatstr = "YYYY-MM-DD HH:mm";
    var mongoByDate = _.reduce(coll, function(memo, entry) {
        var W = moment(entry.when).format(formatstr);

        if(!memo[W])
            memo[W] = { date: moment(entry.when).format(formatstr) };
            
        if(_.size(entry.name) <= 3) {
            /* is a Vantage Point, the only with 'saved' */
            _.set(memo[W], entry.name + 'saved', entry.phantom);
        } 
        _.set(memo[W], entry.name + 'accesses', entry.accesses);
        return memo;
    }, {});

    var memoryByDate = _.reduce(coll, function(memo, entry) {
        var W = moment(entry.when).format(formatstr);

        if(!memo[W])
            memo[W] = { date: moment(entry.when).format(formatstr) };
            
        _.set(memo[W], entry.name + 'free', _.round(entry.free / 1024) );
        _.set(memo[W], entry.name + 'total', _.round(entry.total / 1024) );
        return memo;
    }, {});

    var loadByDate = _.reduce(coll, function(memo, entry) {
        if(!entry.loadavg || !entry.loadavg[0])
            return memo;

        var W = moment(entry.when).format(formatstr);
        if(!memo[W])
            memo[W] = { date: moment(entry.when).format(formatstr) };

        _.set(memo[W], entry.name + 'load-0', _.round(entry.loadavg[0] * 1000) );
        _.set(memo[W], entry.name + 'load-1', _.round(entry.loadavg[1] * 1000) );
        _.set(memo[W], entry.name + 'load-2', _.round(entry.loadavg[2] * 1000) );
        return memo;
    }, {});

    return { 
        memory: _.values(memoryByDate),
        mongo: _.values(mongoByDate),
        loadavg: _.values(loadByDate),
    };
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
