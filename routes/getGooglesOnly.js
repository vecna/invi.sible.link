var _ = require('lodash');
var debug = require('debug')('route:getGooglesOnly');
var moment = require('moment');
var nconf = require('nconf');

var mongo = require('../lib/mongo');
var google = require('../lib/google');
var promises = require('../lib/promises');
 
/* This API return only the evidences marked as 'Google',
 * it interpolate the table `evidences` with the table `sites` */
function getGooglesOnly(req) {

    var min = moment()
            .subtract(1, 'd')
            .startOf('day')
            .format("YYYY-MM-DD");

    var mid = moment()
            .startOf('day')
            .format("YYYY-MM-DD");

    var max = moment()
            .add(1, 'd')
            .startOf('day')
            .format("YYYY-MM-DD");

    var past = { when : { '$gte': new Date(min), '$lt': new Date(mid) } };
    _.set(past , 'campaign', req.params.campaign);
    var today = { when : { '$gte': new Date(mid), '$lt': new Date(max) } };
    _.set(today, 'campaign', req.params.campaign);

    return Promise
        .all([
             mongo.read(nconf.get('schema').evidences, past),
             mongo.read(nconf.get('schema').evidences, today),
             mongo.read(nconf.get('schema').sites, { campaign: req.params.campaign })
        ])
        .then(function(mix) {

            var ref = _.size(mix[1]) ? mix[1] : mix[0];
            var keepf = [ "url", "href", "target", "company", "requestTime" ];
            var evidences = _.reduce(ref, function(memo, e) {
                var save = _.pick(e, keepf);
                if(e.target)
                    memo.push(save);
                if(e.company === 'Google') {
                    save.product = google.attributeProduct(e);
                    memo.push(save);
                }
                return memo;
            }, []);

            var stats = { targetMatch: 0, googles: 0, missing: 0 };

            /* logic is:
                - iterated on the configured `sites` from mix[2]
                - look if any Google reference is present there
                - look if the target:true is present there       */
            var ret = _.reduce(mix[2], function(memo, p) {
                var t = _.find(evidences, { href: p.href, target: true });
                if(t) {
                    stats.targetMatch++;
                    t.description = p.description;
                    memo.push(t);
                }
                var gugls = _.filter(evidences, { href: p.href, company: "Google" });
                if(_.size(gugls)) {
                    stats.googles += _.size(gugls);
                    var ready = _.map(gugls, function(g) {
                        g.description = p.description;
                        return g;
                    });
                    return _.concat(memo, ready);
                } else {
                    stats.missing++;
                    memo.push(_.extend(_.pick(p, [ "href", "description" ]), { empty: true }));
                    return memo;
                }
            }, []);
            debug("Reduction of %d sites configured with %d evidences collected, total %d: %j",
                _.size(mix[2]), _.size(evidences), _.size(ret), stats);
            return ret;
        })
        .then(function(c) {
            debug("Mix between all the info has %d objects", _.size(c));
            return { 'json': c };
        });
};

module.exports = getGooglesOnly;
