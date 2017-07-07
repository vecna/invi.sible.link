var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('route:getTableauJSON');
var moment = require('moment');
var nconf = require('nconf');

var campaignOps = require('../lib/campaignOps');
 
function getTableauJSON(req) {

    var filter = { campaign: req.params.cname };
    var past = 24 * 1;

    debug("%s getTableauJSON filter %j hours %d", req.randomUnicode, filter, past);

    return campaignOps.getEvidences(filter, past)
	.then(function(all) {
            var targets = _.filter(all, { target: true});
            var ret = _.reduce(targets, function(memo, t) {
                memo[t.promiseId] = {
                    url: t.url,
                    requestTime: t.requestTime,
		    i: []	
		};
                return memo;
	    }, {});

            return _.reduce( _.reject(all, { target: true }), function(memo, e) {
                if(_.startsWith(e.url, 'data:'))
                    return memo;
                if(!e.company)
                    return memo;
                if(!memo[e.promiseId]) {
		    debug("missing promiseId in init?");
		    return memo;
	        }
                var d = {
		    connects: e.domaindottld,
                    company: e.company,
                    "Content-Type": _.replace(_.replace(
			    e['Content-Type'], /.*\//,
			    ''), /;.*/, '')
		};
		memo[e.promiseId].i.push(d);
                return memo;
	    }, ret);
	})
	.then(_.values)
        .then(function(reduced) {
            debug("getTableauJSON returns: %d", _.size(reduced));
            return {
                'json': reduced
            }
        });
};

module.exports = getTableauJSON;
