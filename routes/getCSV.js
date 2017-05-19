var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('route:getCSV');
var moment = require('moment');
var nconf = require('nconf');
 
var campaignOps = require('../lib/campaignOps');

function getCSV(req) {

    var filter = { campaign: req.params.campaign };
    var past = 36;

    debug("%s getCSV filter %j hours %d", req.randomUnicode, filter, past);
    var keys = ['url', 'trackers', 'others' ];

    return campaignOps.pickLastHours(filter, past)
        .map(function(e) {
            e.trackers = _.size(e.companies);
            e.others = _.size(e.unrecognized);
            return e;
        })
        .then(function(surface) {
            /* for every website, if duplicated, keep the one with most */
            debug("Keeping only one entry per site: maybe this has to be done client site. Starting from %d",
                _.size(surface));
            return _.reduce(surface, function(memo, s) {
                var exists = _.find(memo, { url: s.url });

                if(exists) {
                    if( _.size(exists.companies) > _.size(s.companies) )
                        return memo;
                    memo = _.reject(memo, { url: s.url });
                }
                memo.push(s);
                return memo;
            }, []);
        })
        .reduce(function(memo, entry) {
            if(!memo.init) {
                memo.csv += _.trim(JSON.stringify(keys), "][") + "\n";
                memo.init = true;
            }

            _.each(keys, function(k, i) {
                var swap;
                swap = _.get(entry, k, "");
                memo.csv += '"' + swap + '"';
                if(!_.eq(i, _.size(keys) - 1))
                    memo.csv += ','
            });

            memo.csv += "\n";
            return memo;
        }, { init: false, csv: ""})
        .then(function(blob) {
            var t = blob.csv;
            debug("csv long %d bytes", _.size(t));
            return {
                text: t
            };
        });
};

module.exports = getCSV;
