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

            return google.composeList(mix[2], evidences);
        })
        .then(function(c) {
            debug("Mix between all the info has %d objects", _.size(c));
            return { 'json': c };
        });
};

module.exports = getGooglesOnly;
