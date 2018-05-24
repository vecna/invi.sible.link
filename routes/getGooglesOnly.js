var _ = require('lodash');
var debug = require('debug')('route:getGooglesOnly');
var moment = require('moment');
var nconf = require('nconf');

var mongo = require('../lib/mongo');
var google = require('../lib/google');
var promises = require('../lib/promises');
 
/* This API return only the evidences marked as 'Google' */

function fetchInfos(filter, cname) {
    return Promise.all([
        mongo
            .read(nconf.get('schema').evidences, filter),
        promises.retrieve(0, cname, null),
        promises.retrieve(1, cname, null),
    ]);
}

function getGooglesOnly(req) {

    var DAYSAGO = 1
    var min = moment()
            .subtract(DAYSAGO +1, 'd')
            .startOf('day')
            .format("YYYY-MM-DD");

    var max = moment()
            .subtract(DAYSAGO, 'd')
            .startOf('day')
            .format("YYYY-MM-DD");

    var filter = {  when : { '$gte': new Date(min), '$lt': new Date(max) } };
    _.set(filter, 'campaign', req.params.campaign);

    var keepf = [ "url", "href", "target", "company" ];

    return fetchInfos(filter, req.params.campaign)
        .then(function(mix) {
            var evidences = _.reduce(mix[0], function(memo, e) {
                var save = _.pick(e, keepf);
                if(e.target)
                    memo.push(save);
                if(e.company === 'Google') {
                    save.product = google.attributeProduct(e);
                    memo.push(save);
                }
                return memo;
            }, []);

            var promiz = _.size(mix[1]) > _.size(mix[2]) ? mix[1] : mix[2];

            var ref = promiz[0].start;
            var stats = { targetMatch: 0, googles: 0, missing: 0 };
            var ret = _.reduce(promiz, function(memo, p) {

                var t = _.find(evidences, { href: p.href, target: true });
                if(t) {
                    stats.targetMatch++;
                    t.description = p.description;
                    t.testMade = p.start;
                    memo.push(t);
                }

                var gugls = _.filter(evidences, { href: p.href, company: 'Google' });
                if(_.size(gugls)) {
                    stats.googles += _.size(gugls);
                    var ready = _.map(gugls, function(g) {
                        g.testMade = p.start;
                        g.description = p.description;
                        return g;
                    });
                    return _.concat(memo, ready);
                } else {
                    stats.missing++;
                    memo.push(_.extend(_.pick(p, ['href', 'description']), { empty: true }));
                    return memo;
                }
            }, []);
            debug("Reduction of %d promises mixing with %d evidences, total %d: %j",
                _.size(promiz), _.size(evidences), _.size(ret), stats);
            return ret;
        })
        .then(function(c) {
            debug("Mix between all the info has %d objects", _.size(c));
            return { 'json': c };
        });
};

module.exports = getGooglesOnly;
