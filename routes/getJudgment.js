var _ = require('lodash');
var debug = require('debug')('route:getJudgment');
var moment = require('moment');
var nconf = require('nconf');

var mongo = require('../lib/mongo');
 
function getJudgment(req) {

    var campaign = req.params.cname;
    var daysback = req.params.daysago ? _.parseInt(req.params.daysago) : 0;

    filter = { campaign: campaign };
    filter.when = { '$gte': new Date( moment()
            .startOf('day')
            .subtract(daysback, 'd')
            .add(10, 'h')
            .format()
        ) };

    return mongo
        .readLimit(nconf.get('schema').judgment, filter, {
            when: -1
        }, 1, 0)
        .then(function(C) {
            if(!_.size(C))
                debug("getJudgment fail for %s (%d daysago)", campaign, daysback);
            else 
                debug("getJudgment success for %s (%d daysago)", campaign, daysback);
            return { 'json': C };
        });
};

module.exports = getJudgment;
