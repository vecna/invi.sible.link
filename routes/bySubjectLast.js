var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('route:bySubjectLast');
var moment = require('moment');
var nconf = require('nconf');
 
var mongo = require('../lib/mongo');

function bySubjectLast(req) {

    var subjectId = req.params.subjectId;
    var days = req.body.past;
    var reference = new Date( moment().subtract(days, 'd').format("YYYY-MM-DD") );

    var filter = { subjectId: subjectId, requestTime: { "$gt": reference } };

    debug(" %s bySubjectLast filter %j", req.randomUnicode, filter);

    return mongo
        .read(nconf.get('schema').phantom, filter)
        .map(function(ret) {
            return _.omit(ret, ['_id']);
        })
        .then(function(rets) {
            return{
                json: rets
            };
        });
};

module.exports = bySubjectLast;
