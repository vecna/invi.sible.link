
var _ = require('lodash');
var Promise = require('bluebird');
var moment = require('moment');
var debug = require('debug')('route:getCampaignSubject');
var nconf = require('nconf');
 
var mongo = require('../lib/mongo');
var subjectsOps = require('../lib/subjectsOps');

/* This API return a surface table of the promises got in the last
 * $RANGE days, in two format (raw and tablized for DataFormat) */

function getCampaignSubject(req) {

    var RANGE = 7;
    var filter = {
        taskName: req.params.cname,
        start: { "$gt": new Date(moment()
                                  .subtract(RANGE, 'd')
                                  .format('YYYY-MM-DD')
                                ) }
    };

    debug("Looking for promises with for the last week %j", filter);
    return mongo
        .read(nconf.get('schema').promises, filter, { start: -1 })
        .reduce(function(memo, promise) {
            var exists = _.find(memo, { href: promise.href });
            if(!exists)
                memo.push(promise);
            return memo;
        }, [] )
        .tap(function(tested) {
            debug("The tested website in the last %d days are %d",
                RANGE, _.size(tested));
        })
        .then(function(all) {

            var tablized = _.map(all, function(e) {
                 var inserted = moment.duration(moment() - moment(e.start) )
                                      .humanize() + " ago";

                return [ e.href, e.description, e.start, inserted ];
            });

            return {
                'json': {
                    'info': all,
                    'table': tablized
                }
            }
        });
};

module.exports = getCampaignSubject;
